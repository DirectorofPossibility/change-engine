// Shared nav — injected by each page
function renderNav(activePage) {
  const links = [
    {href:'explore.html',label:'Explore'},
    {href:'pathways.html',label:'Pathways'},
    {href:'organizations.html',label:'Organizations'},
    {href:'officials.html',label:'Officials'},
    {href:'policies.html',label:'Policies'},
    {href:'news.html',label:'News'},
    {href:'chat.html',label:'Ask Chance'},
  ];
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">Community <span>Exchange</span></a>
      <div class="nav-links">
        ${links.map(l=>`<a href="${l.href}" class="nav-link${activePage===l.label?' active':''}">${l.label}</a>`).join('')}
      </div>
      <div class="nav-right">
        <input class="nav-search" type="text" placeholder="Search anything…" onfocus="window.location='search.html'" />
        <a href="signup.html" class="btn-nav">Sign In</a>
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-logo">Community Exchange</div>
      <div class="footer-tagline">Everything here already existed. The way in is new.</div>
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-col-title">Explore</div>
          <a href="pathways.html">Pathways</a>
          <a href="organizations.html">Organizations</a>
          <a href="officials.html">Officials</a>
          <a href="policies.html">Policies</a>
          <a href="services.html">Services</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Tools</div>
          <a href="chat.html">Ask Chance</a>
          <a href="search.html">Search</a>
          <a href="explore.html">Compass</a>
          <a href="news.html">News</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">About</div>
          <a href="about.html">About</a>
          <a href="about.html">Our Approach</a>
          <a href="about.html">Partner With Us</a>
          <a href="about.html">Contact</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">The Change Lab</div>
          <a href="#">Impact Hub Houston</a>
          <a href="#">Fiscal Sponsor</a>
          <a href="about.html">Donate</a>
          <a href="signup.html">Sign Up</a>
        </div>
      </div>
      <div class="footer-bottom">© 2026 The Change Lab · Fiscally sponsored by Impact Hub Houston 501(c)(3) · hello@changeengine.us · Community life, organized.</div>
    </div>
  </footer>`;
}
