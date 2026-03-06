#!/usr/bin/env python3
"""
Scrape thechangelab.net/resourcecenter directory and insert into content_inbox via REST API.

The Change Lab resource center is a DIRECTORY of external assets — each page curates
content from external organizations. This script extracts the original source URL
from each resource page and attributes content to the original creator, not The Change Lab.

Extracts: title, description, image_url, source_url (original), source_domain (original),
          referral_url (the Change Lab directory page).

Usage:
  python3 scripts/ingest-changelab-local.py
"""

import json
import re
import time
import urllib.request
import urllib.error
import ssl
import hashlib
import os
import sys

# ── Config ──────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xesojwzcnjqtpuossmuv.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SECRET_KEY"]  # Set via environment variable
URLS_FILE = os.path.join(os.path.dirname(__file__), "changelab-urls.txt")
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), ".ingest-progress.json")
DELAY_BETWEEN = 1.0  # seconds between requests to be polite
DIRECTORY_DOMAIN = "www.thechangelab.net"  # The Change Lab is the directory, not the source

# Allow self-signed / older SSL
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# ── Helpers ─────────────────────────────────────────────────────────────

def fetch_page(url, timeout=10):
    """Fetch a URL and return the HTML."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "TheChangeEngine/2.0",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx)
        return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None


def extract_meta(html):
    """Extract title, description, and image_url from HTML meta tags."""
    title = None
    description = None
    image_url = None

    # <title>
    m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    if m:
        title = m.group(1).strip()
        # Remove " — THE CHANGE LAB" suffix
        title = re.sub(r"\s*[—–-]\s*THE CHANGE LAB\s*$", "", title, flags=re.I).strip()

    # og:description
    m = (re.search(r'property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
         or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:description["\']', html, re.I))
    if m:
        description = m.group(1).strip()

    # meta description fallback
    if not description:
        m = (re.search(r'name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
             or re.search(r'content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', html, re.I))
        if m:
            description = m.group(1).strip()

    # Body text fallback (strip nav/footer/script/style)
    if not description or len(description) < 50:
        body_match = re.search(r"<body[^>]*>([\s\S]*?)</body>", html, re.I)
        if body_match:
            body = body_match.group(1)
            body = re.sub(r"<script[^>]*>[\s\S]*?</script>", " ", body, flags=re.I)
            body = re.sub(r"<style[^>]*>[\s\S]*?</style>", " ", body, flags=re.I)
            body = re.sub(r"<nav[^>]*>[\s\S]*?</nav>", " ", body, flags=re.I)
            body = re.sub(r"<footer[^>]*>[\s\S]*?</footer>", " ", body, flags=re.I)
            body = re.sub(r"<header[^>]*>[\s\S]*?</header>", " ", body, flags=re.I)
            body = re.sub(r"<[^>]+>", " ", body)
            body = re.sub(r"\s+", " ", body).strip()[:500]
            if body and (not description or len(body) > len(description)):
                description = body

    # og:image
    m = (re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
         or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html, re.I))
    if m:
        image_url = m.group(1).strip()
    else:
        # twitter:image fallback
        m = (re.search(r'name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
             or re.search(r'content=["\']([^"\']+)["\'][^>]*name=["\']twitter:image["\']', html, re.I))
        if m:
            image_url = m.group(1).strip()

    # Also try to find first significant <img> if no og:image
    if not image_url:
        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
        for img_src in imgs:
            # Skip tiny icons, tracking pixels, logos
            if any(skip in img_src.lower() for skip in ["logo", "icon", "pixel", "1x1", "spacer", "favicon"]):
                continue
            image_url = img_src
            break

    return title, description, image_url


def extract_original_source(html, directory_url):
    """Extract the original external source URL from a Change Lab resource page.

    The Change Lab resource center pages typically link to the original asset.
    We look for prominent external links that aren't navigation/social/changelab links.
    Returns (source_url, source_domain) or (None, None) if not found.
    """
    # Look for external links in the main content area
    # First try: links with explicit "source", "original", "visit", "read more", "learn more" text
    source_patterns = [
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>[^<]*(?:visit|original|source|read more|learn more|view|go to|website)[^<]*</a>',
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>\s*(?:Visit|Original|Source|Read More|Learn More|View|Go to|Website)',
    ]

    skip_domains = {
        "thechangelab.net", "www.thechangelab.net",
        "facebook.com", "twitter.com", "x.com", "instagram.com",
        "linkedin.com", "youtube.com", "tiktok.com",
        "squarespace.com", "wix.com", "wordpress.com",
    }

    def is_valid_source(url):
        if not url or not url.startswith("http"):
            return False
        try:
            domain = url.split("//")[1].split("/")[0].lower()
            return not any(skip in domain for skip in skip_domains)
        except Exception:
            return False

    def get_domain(url):
        try:
            return url.split("//")[1].split("/")[0].lower()
        except Exception:
            return None

    # Try source-indicator patterns first
    for pattern in source_patterns:
        matches = re.findall(pattern, html, re.I)
        for match in matches:
            if is_valid_source(match):
                return match, get_domain(match)

    # Fallback: find all external links and pick the most prominent one
    all_links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\']', html, re.I)
    external_links = [url for url in all_links if is_valid_source(url)]

    if external_links:
        # Return the first external link (most likely the primary source)
        return external_links[0], get_domain(external_links[0])

    # No external source found — this might be original Change Lab content
    return None, None


def supabase_rest(method, path, data=None):
    """Make a Supabase REST API request."""
    url = SUPABASE_URL + "/rest/v1/" + path
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=15, context=ssl_ctx)
        return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"error": body}, e.code


def check_existing_urls(urls):
    """Check which URLs already exist in content_inbox."""
    # Query in batches of 50
    existing = set()
    for i in range(0, len(urls), 50):
        batch = urls[i:i+50]
        url_filter = ",".join('"' + u + '"' for u in batch)
        path = f"content_inbox?source_url=in.({url_filter})&select=source_url"
        data, status = supabase_rest("GET", path)
        if status == 200 and isinstance(data, list):
            for item in data:
                existing.add(item["source_url"])
    return existing


def insert_inbox(record):
    """Insert a record into content_inbox."""
    data, status = supabase_rest("POST", "content_inbox", record)
    return data, status


def load_progress():
    """Load progress from checkpoint file."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"completed": [], "failed": []}


def save_progress(progress):
    """Save progress to checkpoint file."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


# ── Main ────────────────────────────────────────────────────────────────

def main():
    # Load URLs
    with open(URLS_FILE) as f:
        all_urls = [line.strip() for line in f if line.strip()]

    print(f"=== Change Lab Directory Import (assets attributed to original sources) ===")
    print(f"  Total URLs: {len(all_urls)}")
    print(f"  Target: {SUPABASE_URL}")
    print()

    # Load progress
    progress = load_progress()
    already_done = set(progress["completed"])

    # Check existing in DB
    print("Checking for duplicates in content_inbox...")
    existing = check_existing_urls(all_urls)
    print(f"  Already in DB: {len(existing)}")

    # Filter to remaining
    remaining = [u for u in all_urls if u not in existing and u not in already_done]
    print(f"  To process: {len(remaining)}")
    print()

    if not remaining:
        print("Nothing to do — all URLs already ingested!")
        return

    succeeded = 0
    failed = 0
    no_content = 0

    for i, url in enumerate(remaining):
        slug = url.split("/")[-1]
        print(f"[{i+1}/{len(remaining)}] {slug}...", end=" ", flush=True)

        # Scrape
        html = fetch_page(url)
        if not html:
            print("FETCH FAILED")
            progress["failed"].append(url)
            failed += 1
            save_progress(progress)
            time.sleep(DELAY_BETWEEN)
            continue

        title, description, image_url = extract_meta(html)

        if not title:
            print("NO TITLE")
            progress["failed"].append(url)
            no_content += 1
            save_progress(progress)
            time.sleep(DELAY_BETWEEN)
            continue

        # Extract original external source (the Change Lab is the directory, not the source)
        original_url, original_domain = extract_original_source(html, url)

        # Insert into content_inbox
        # If an original source was found, attribute to it; otherwise mark as Change Lab original
        record = {
            "source_url": original_url or url,
            "source_domain": original_domain or DIRECTORY_DOMAIN,
            "title": title,
            "description": description[:2000] if description else None,
            "image_url": image_url,
            "status": "pending",
            "source_trust_level": "trusted",
            "referral_url": url,  # Always preserve the Change Lab directory page
        }
        # If no external source found, this is likely original Change Lab content
        if not original_url:
            record["source_org_name"] = "The Change Lab"

        data, status = insert_inbox(record)

        if status in (200, 201):
            inbox_id = data[0]["id"] if isinstance(data, list) and data else "?"
            has_img = "img" if image_url else "no-img"
            src_label = original_domain or "changelab-original"
            print(f"OK ({has_img}) [{inbox_id[:8]}] → {src_label}")
            progress["completed"].append(url)
            succeeded += 1
        elif status == 409:
            print("DUPLICATE")
            progress["completed"].append(url)
        else:
            print(f"ERROR ({status}): {json.dumps(data)[:100]}")
            progress["failed"].append(url)
            failed += 1

        save_progress(progress)
        time.sleep(DELAY_BETWEEN)

    print()
    print(f"=== DONE ===")
    print(f"  Succeeded:  {succeeded}")
    print(f"  Failed:     {failed}")
    print(f"  No content: {no_content}")
    print(f"  Total in DB: {len(existing) + succeeded}")
    print()
    print("Next steps:")
    print("  1. Run classify-content-v2 on pending items (via dashboard or edge function)")
    print("  2. Review in Content Review Queue")
    print("  3. Publish approved items")

    # Clean up progress file on success
    if failed == 0:
        if os.path.exists(PROGRESS_FILE):
            os.remove(PROGRESS_FILE)


if __name__ == "__main__":
    main()
