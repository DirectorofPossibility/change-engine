import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const js = `
var SB_URL = 'https://xesojwzcnjqtpuossmuv.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlc29qd3pjbmpxdHB1b3NzbXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODEzODUsImV4cCI6MjA4NzU1NzM4NX0.9B3_TX3qBG0SXI9UifYH7sJQMmiHjc_YRbaYBAk7l0w';
var db = supabase.createClient(SB_URL, SB_KEY);

var THEMES = {
  THEME_01: { name: 'Our Health', color: '#A85C3B' },
  THEME_02: { name: 'Our Families', color: '#7A6E8A' },
  THEME_03: { name: 'Our Neighborhood', color: '#4A6A8A' },
  THEME_04: { name: 'Our Voice', color: '#8B7D3C' },
  THEME_05: { name: 'Our Money', color: '#4A6B52' },
  THEME_06: { name: 'Our Planet', color: '#3D7A7A' },
  THEME_07: { name: 'The Bigger We', color: '#C65D28' },
};

async function q(table, select, filters, opts) {
  select = select || '*';
  filters = filters || {};
  opts = opts || {};
  var query = db.from(table).select(select);
  Object.keys(filters).forEach(function(k) { query = query.eq(k, filters[k]); });
  if (opts.order) query = query.order(opts.order, { ascending: opts.asc !== false });
  if (opts.limit) query = query.limit(opts.limit);
  var res = await query;
  if (res.error) { console.error('[CE] Error on ' + table + ':', res.error); return []; }
  return res.data || [];
}

function h(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function trunc(s, n) { return s ? (s.length > n ? s.slice(0, n) + '...' : s) : ''; }
function fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch(e) { return ''; } }
function themeColor(id) { return (THEMES[id] || {}).color || '#8A8070'; }
function themeName(id) { return (THEMES[id] || {}).name || id; }
function pct(cur, total) { if (!total || !cur) return 0; return Math.min(100, Math.round((cur / parseFloat(total)) * 100)); }
console.log('[CE] Config loaded');
`;

Deno.serve(() => new Response(js, {
  headers: {
    'Content-Type': 'application/javascript',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60'
  }
}));
