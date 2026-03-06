/**
 * GET /design2
 *
 * Serves the journey mockup HTML with live data from Supabase injected.
 * Replaces placeholder counts and sample content with real database values.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  // ── Fetch live data in parallel ──
  const [
    { count: contentCount },
    { count: officialsCount },
    { count: policiesCount },
    { count: orgsCount },
    { count: eventsCount },
    { count: opportunitiesCount },
    { count: foundationsCount },
    { count: neighborhoodsCount },
    { count: guidesCount },
    { count: focusAreasCount },
    { data: recentContent },
    { data: themes },
    { data: officials },
    { data: events },
    { data: orgs },
    { data: foundations },
    { data: neighborhoods },
    { data: archetypes },
    { data: policies },
    { data: learningPaths },
    { data: lifeSituations },
    { data: campaigns },
  ] = await Promise.all([
    supabase.from('content_published').select('*', { count: 'exact', head: true }),
    supabase.from('elected_officials').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('foundations').select('*', { count: 'exact', head: true }),
    supabase.from('super_neighborhoods').select('*', { count: 'exact', head: true }),
    supabase.from('guides').select('*', { count: 'exact', head: true }),
    supabase.from('focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('content_published').select('id, title_6th_grade, resource_type, pathway_primary, image_url, published_at, source_url').order('published_at', { ascending: false }).limit(8),
    supabase.from('themes').select('theme_id, theme_name, theme_color, focus_area_count').order('theme_id'),
    supabase.from('elected_officials').select('official_id, official_name, title, level, party').limit(8),
    supabase.from('events').select('event_id, event_name, event_type, start_datetime, address, city').limit(6),
    supabase.from('organizations').select('org_id, org_name, description_5th_grade, logo_url, city').limit(6),
    supabase.from('foundations').select('id, name, type, geo_level, annual_giving').limit(6),
    supabase.from('super_neighborhoods').select('sn_id, sn_name, sn_number').order('sn_number').limit(12),
    (supabase as any).from('archetypes').select('archetype_id, archetype_name, description, icon_name').order('sort_order'),
    supabase.from('policies').select('policy_id, policy_name, policy_type, level, status, summary_5th_grade').limit(6),
    supabase.from('learning_paths').select('path_id, path_name, path_description, difficulty_level').limit(6),
    supabase.from('life_situations').select('situation_id, situation_name, situation_slug, description_5th_grade, urgency_level').limit(8),
    supabase.from('campaigns').select('campaign_id, campaign_name, campaign_type, description_5th_grade').limit(4),
  ])

  // ── Read the HTML template ──
  const templatePath = join(process.cwd(), 'public', 'templates', 'journey-mockup-2026-03.html')
  let html = await readFile(templatePath, 'utf-8')

  // ── Inject live counts ──
  const totalItems = (contentCount || 0) + (orgsCount || 0) + (officialsCount || 0) + (policiesCount || 0) + (eventsCount || 0) + (opportunitiesCount || 0)

  // Replace the collage stat counters
  html = html.replace(
    /<span class="n">3,024<\/span> resources/g,
    `<span class="n">${totalItems.toLocaleString()}</span> resources`
  )
  html = html.replace(
    /<span class="n">312<\/span> topics/g,
    `<span class="n">${(focusAreasCount || 0).toLocaleString()}</span> topics`
  )
  // Replace hardcoded counts throughout
  html = html.replaceAll('3,024 items', `${totalItems.toLocaleString()} items`)
  html = html.replaceAll('3,024 resources', `${totalItems.toLocaleString()} resources`)
  html = html.replaceAll('240+ Orgs', `${(orgsCount || 0)} Orgs`)
  html = html.replaceAll('240+', `${(orgsCount || 0)}+`)

  // ── Build data object for JS injection ──
  const liveData = {
    counts: {
      content: contentCount || 0,
      officials: officialsCount || 0,
      policies: policiesCount || 0,
      organizations: orgsCount || 0,
      events: eventsCount || 0,
      opportunities: opportunitiesCount || 0,
      foundations: foundationsCount || 0,
      neighborhoods: neighborhoodsCount || 0,
      guides: guidesCount || 0,
      focusAreas: focusAreasCount || 0,
    },
    recentContent: recentContent || [],
    themes: themes || [],
    officials: officials || [],
    events: events || [],
    organizations: orgs || [],
    foundations: foundations || [],
    neighborhoods: neighborhoods || [],
    archetypes: archetypes || [],
    policies: policies || [],
    learningPaths: learningPaths || [],
    lifeSituations: lifeSituations || [],
    campaigns: campaigns || [],
  }

  // ── Inject live data + rendering script before </body> ──
  const dataScript = `
<script>
// ── LIVE DATA FROM SUPABASE ──
const LIVE = ${JSON.stringify(liveData)};

// ── Wire live data into screens on load ──
document.addEventListener('DOMContentLoaded', function() {
  wireData();
});

function wireData() {
  // ── HOME: Stats bar update ──
  // Already replaced server-side in the collage stats

  // ── HOME: Quick access card subtitles with counts ──
  wireCardSubtitle('calendar-index', LIVE.counts.events + ' upcoming events');
  wireCardSubtitle('news-index', LIVE.counts.content + ' articles and stories');
  wireCardSubtitle('services-index', LIVE.counts.organizations + ' organizations ready to help');

  // ── COMMUNITY CENTER: Wire neighborhood count ──
  wireCountBadge('screen-community-center', 'Neighborhoods', LIVE.counts.neighborhoods);
  wireCountBadge('screen-community-center', 'Organizations', LIVE.counts.organizations);
  wireCountBadge('screen-community-center', 'Foundations', LIVE.counts.foundations);

  // ── LEARNING CENTER: Wire counts ──
  wireCountBadge('screen-learning-center', 'Library', LIVE.counts.content);
  wireCountBadge('screen-learning-center', 'Guides', LIVE.counts.guides);

  // ── ACTION CENTER: Wire counts ──
  wireCountBadge('screen-action-center', 'Elected Officials', LIVE.counts.officials);
  wireCountBadge('screen-action-center', 'Policies', LIVE.counts.policies);

  // ── RESOURCE CENTER: Wire counts ──
  wireCountBadge('screen-resource-center', 'Opportunities', LIVE.counts.opportunities);

  // ── NEIGHBORHOODS INDEX: Populate with real data ──
  populateNeighborhoods();

  // ── OFFICIALS INDEX: Populate with real data ──
  populateOfficials();

  // ── NEWS INDEX: Populate recent content ──
  populateNews();

  // ── ORGANIZATIONS INDEX: Populate with real data ──
  populateOrgs();

  // ── FOUNDATIONS INDEX ──
  populateFoundations();

  // ── EVENTS / CALENDAR ──
  populateEvents();

  // ── POLICIES INDEX ──
  populatePolicies();

  // ── PATHWAY PAGE: Wire themes ──
  populatePathways();
}

function wireCardSubtitle(screenId, text) {
  var cards = document.querySelectorAll('.ph-card');
  cards.forEach(function(card) {
    var onclick = card.getAttribute('onclick') || '';
    if (onclick.indexOf(screenId) !== -1) {
      var sub = card.querySelector('.ph-sub');
      if (sub) sub.textContent = text;
    }
  });
}

function wireCountBadge(screenId, label, count) {
  var screen = document.getElementById(screenId);
  if (!screen) return;
  var links = screen.querySelectorAll('.idx-link, .il-link, a');
  links.forEach(function(link) {
    if (link.textContent.trim().indexOf(label) !== -1) {
      var badge = link.querySelector('.count, .idx-count');
      if (badge) badge.textContent = count;
    }
  });
}

function populateNeighborhoods() {
  var container = document.querySelector('#screen-neighborhoods .sp-grid, #screen-neighborhoods .sp-grid-4');
  if (!container || !LIVE.neighborhoods.length) return;
  container.innerHTML = '';
  LIVE.neighborhoods.forEach(function(n) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('neighborhood-profile'); };
    card.innerHTML = '<div class="idx-card-color" style="background:var(--hood);height:6px;border-radius:6px 6px 0 0;"></div>'
      + '<div style="padding:16px;">'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;letter-spacing:0.1em;">SN-' + n.sn_number + '</div>'
      + '<div style="font-family:var(--serif);font-size:15px;font-weight:600;margin-top:4px;">' + escHtml(n.sn_name) + '</div>'
      + '</div>';
    container.appendChild(card);
  });
}

function populateOfficials() {
  var container = document.querySelector('#screen-officials-index .sp-grid, #screen-officials-index .sp-grid-4');
  if (!container || !LIVE.officials.length) return;
  container.innerHTML = '';
  LIVE.officials.forEach(function(o) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('official-profile'); };
    card.style.cursor = 'pointer';
    card.innerHTML = '<div style="padding:16px;">'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;letter-spacing:0.1em;">' + escHtml(o.level || '') + (o.party ? ' &middot; ' + escHtml(o.party) : '') + '</div>'
      + '<div style="font-family:var(--serif);font-size:15px;font-weight:600;margin-top:4px;">' + escHtml(o.official_name) + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:2px;">' + escHtml(o.title || '') + '</div>'
      + '</div>';
    container.appendChild(card);
  });
}

function populateNews() {
  var container = document.querySelector('#screen-news-index .sp-grid, #screen-news-index .sp-grid-4');
  if (!container || !LIVE.recentContent.length) return;
  container.innerHTML = '';
  LIVE.recentContent.forEach(function(c) {
    var themeColor = getThemeColor(c.pathway_primary);
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('content-profile'); };
    card.style.cursor = 'pointer';
    var imgHtml = c.image_url
      ? '<img src="' + escHtml(c.image_url) + '" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;" onerror="this.style.display=\\'none\\'">'
      : '<div style="height:6px;border-radius:10px 10px 0 0;background:' + themeColor + ';"></div>';
    card.innerHTML = imgHtml
      + '<div style="padding:14px;">'
      + '<div style="font-family:var(--serif);font-size:14px;font-weight:600;line-height:1.3;">' + escHtml(c.title_6th_grade || '') + '</div>'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;margin-top:6px;">' + escHtml(c.resource_type || '') + '</div>'
      + '</div>';
    container.appendChild(card);
  });
}

function populateOrgs() {
  var container = document.querySelector('#screen-organizations-index .sp-grid, #screen-organizations-index .sp-grid-4');
  if (!container || !LIVE.organizations.length) return;
  container.innerHTML = '';
  LIVE.organizations.forEach(function(o) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('org-profile'); };
    card.style.cursor = 'pointer';
    card.innerHTML = '<div style="padding:16px;">'
      + '<div style="font-family:var(--serif);font-size:15px;font-weight:600;">' + escHtml(o.org_name) + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4;">' + escHtml((o.description_5th_grade || '').substring(0, 100)) + (o.description_5th_grade && o.description_5th_grade.length > 100 ? '...' : '') + '</div>'
      + (o.city ? '<div style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;margin-top:6px;">' + escHtml(o.city) + '</div>' : '')
      + '</div>';
    container.appendChild(card);
  });
}

function populateFoundations() {
  var container = document.querySelector('#screen-foundations-index .sp-grid, #screen-foundations-index .sp-grid-4');
  if (!container || !LIVE.foundations.length) return;
  container.innerHTML = '';
  LIVE.foundations.forEach(function(f) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.style.cursor = 'pointer';
    card.innerHTML = '<div style="padding:16px;">'
      + '<div style="font-family:var(--serif);font-size:15px;font-weight:600;">' + escHtml(f.name) + '</div>'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;margin-top:6px;">' + escHtml(f.type || '') + ' &middot; ' + escHtml(f.geo_level || '') + '</div>'
      + (f.annual_giving ? '<div style="font-size:12px;color:var(--accent);font-weight:700;margin-top:4px;">$' + Number(f.annual_giving).toLocaleString() + '/yr</div>' : '')
      + '</div>';
    container.appendChild(card);
  });
}

function populateEvents() {
  var container = document.querySelector('#screen-calendar-index .sp-grid, #screen-calendar-index .sp-grid-4');
  if (!container || !LIVE.events.length) return;
  container.innerHTML = '';
  LIVE.events.forEach(function(e) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.style.cursor = 'pointer';
    var dateStr = e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    card.innerHTML = '<div style="padding:16px;">'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--accent);text-transform:uppercase;letter-spacing:0.1em;">' + escHtml(dateStr) + '</div>'
      + '<div style="font-family:var(--serif);font-size:15px;font-weight:600;margin-top:4px;">' + escHtml(e.event_name) + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:4px;">' + escHtml(e.event_type || '') + '</div>'
      + (e.address ? '<div style="font-size:11px;color:var(--muted-lt);margin-top:4px;">' + escHtml(e.address) + (e.city ? ', ' + escHtml(e.city) : '') + '</div>' : '')
      + '</div>';
    container.appendChild(card);
  });
}

function populatePolicies() {
  var container = document.querySelector('#screen-policies-index .sp-grid, #screen-policies-index .sp-grid-4');
  if (!container || !LIVE.policies.length) return;
  container.innerHTML = '';
  LIVE.policies.forEach(function(p) {
    var statusColor = p.status === 'Active' ? 'var(--action)' : p.status === 'Proposed' ? 'var(--accent)' : 'var(--muted)';
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('policy-profile'); };
    card.style.cursor = 'pointer';
    card.innerHTML = '<div style="padding:16px;">'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<span style="font-family:var(--mono);font-size:9px;color:var(--muted-lt);text-transform:uppercase;">' + escHtml(p.level || '') + '</span>'
      + (p.status ? '<span style="font-size:9px;font-weight:700;color:' + statusColor + ';text-transform:uppercase;">' + escHtml(p.status) + '</span>' : '')
      + '</div>'
      + '<div style="font-family:var(--serif);font-size:14px;font-weight:600;margin-top:4px;line-height:1.3;">' + escHtml(p.policy_name) + '</div>'
      + (p.summary_5th_grade ? '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4;">' + escHtml(p.summary_5th_grade.substring(0, 120)) + '...</div>' : '')
      + '</div>';
    container.appendChild(card);
  });
}

function populatePathways() {
  var container = document.querySelector('#screen-pathways-index .sp-grid, #screen-pathways-index .sp-grid-4');
  if (!container || !LIVE.themes.length) return;
  container.innerHTML = '';
  LIVE.themes.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'idx-card';
    card.onclick = function() { showScreen('pathway-page'); };
    card.style.cursor = 'pointer';
    card.innerHTML = '<div style="height:8px;border-radius:10px 10px 0 0;background:' + escHtml(t.theme_color) + ';"></div>'
      + '<div style="padding:16px;">'
      + '<svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="' + escHtml(t.theme_color) + '" stroke-width="2"><circle cx="50" cy="50" r="20"/><circle cx="50" cy="30" r="20"/><circle cx="50" cy="70" r="20"/><circle cx="67" cy="40" r="20"/><circle cx="67" cy="60" r="20"/><circle cx="33" cy="40" r="20"/><circle cx="33" cy="60" r="20"/></svg>'
      + '<div style="font-family:var(--serif);font-size:16px;font-weight:600;margin-top:6px;">' + escHtml(t.theme_name) + '</div>'
      + '<div style="font-family:var(--mono);font-size:10px;color:var(--muted-lt);margin-top:4px;">' + t.focus_area_count + ' focus areas</div>'
      + '</div>';
    container.appendChild(card);
  });
}

function getThemeColor(themeId) {
  var map = {
    THEME_01: '#e53e3e', THEME_02: '#dd6b20', THEME_03: '#d69e2e',
    THEME_04: '#38a169', THEME_05: '#3182ce', THEME_06: '#319795', THEME_07: '#805ad5'
  };
  return map[themeId] || '#C75B2A';
}

function escHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
</script>
`

  // Inject before </body>
  html = html.replace('</body>', dataScript + '</body>')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
