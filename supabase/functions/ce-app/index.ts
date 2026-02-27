import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FUNCTIONS_BASE = 'https://xesojwzcnjqtpuossmuv.supabase.co/functions/v1';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Community Exchange</title>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--sans:'DM Sans',system-ui,sans-serif;--ser:'Newsreader',Georgia,serif;--bg:#F0EDE6;--card:#FFF;--cream:#F7F5F1;--cream2:#EDE8E0;--txt:#1A1814;--mid:#4A4540;--lt:#8A8070;--lt2:#B0A898;--bdr:#E0D9D0;--bdr2:#D0C9BE;--acc:#C65D28;--teal:#3D7A7A;--navy:#0D1B2A;--T1:#A85C3B;--T2:#7A6E8A;--T3:#4A6A8A;--T4:#8B7D3C;--T5:#4A6B52;--T6:#3D7A7A;--T7:#C65D28;--r:8px}
html{font-size:15px;-webkit-font-smoothing:antialiased}
body{font-family:var(--sans);color:var(--txt);background:var(--bg);min-height:100vh}
.tb{background:var(--navy);color:#fff;padding:0 24px;height:48px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.tb-logo{font-family:var(--ser);font-size:16px;font-weight:600}.tb-logo span{color:var(--acc)}
.tb-nav{display:flex;gap:4px}.tb-nav button{font-family:var(--sans);font-size:12px;font-weight:500;background:0 0;color:rgba(255,255,255,.6);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;transition:.2s}.tb-nav button:hover{color:#fff;background:rgba(255,255,255,.08)}.tb-nav button.on{color:#fff;background:rgba(255,255,255,.12);font-weight:700}
#app{max-width:960px;margin:0 auto;padding:28px 20px 60px}
.ld{text-align:center;padding:60px 20px;color:var(--lt);font-family:var(--ser);font-style:italic}
.c{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:20px;transition:.15s}.c:hover{border-color:var(--bdr2);box-shadow:0 2px 8px rgba(0,0,0,.04)}
.ck{cursor:pointer}
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:700px){.g2,.g3{grid-template-columns:1fr}}
.sh{margin:32px 0 14px;display:flex;align-items:baseline;justify-content:space-between}.sh h2{font-family:var(--ser);font-size:22px;font-weight:600}.sh .sub{font-family:var(--ser);font-size:13px;color:var(--lt);font-style:italic}
.tag{display:inline-block;font-family:var(--sans);font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px}
.uc{background:#C62828;color:#fff}.uh{background:#E65100;color:#fff}.um{background:#F9A825;color:#1A1814}.ul{background:#2E7D32;color:#fff}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:200;opacity:0;pointer-events:none;transition:.25s}.ov.show{opacity:1;pointer-events:auto}
.dp{position:fixed;top:0;right:-480px;width:480px;max-width:90vw;height:100vh;background:var(--card);z-index:201;overflow-y:auto;transition:.3s;box-shadow:-4px 0 20px rgba(0,0,0,.1);padding:28px 24px}.dp.open{right:0}
.dpx{position:absolute;top:14px;right:14px;background:var(--cream);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--lt)}
.pw-T1{border-left:4px solid var(--T1)}.pw-T2{border-left:4px solid var(--T2)}.pw-T3{border-left:4px solid var(--T3)}.pw-T4{border-left:4px solid var(--T4)}.pw-T5{border-left:4px solid var(--T5)}.pw-T6{border-left:4px solid var(--T6)}.pw-T7{border-left:4px solid var(--T7)}
.prog{height:6px;background:var(--cream2);border-radius:3px;overflow:hidden;margin:6px 0}.prog-fill{height:100%;border-radius:3px;transition:.4s}
.tbl{width:100%;border-collapse:collapse;font-size:13px}.tbl th{text-align:left;font-weight:600;padding:8px 10px;border-bottom:2px solid var(--bdr);color:var(--lt);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.tbl td{padding:8px 10px;border-bottom:1px solid var(--cream2)}.tbl tr:hover td{background:var(--cream)}
.sb{font-family:var(--sans);font-size:13px;padding:10px 14px;border:1px solid var(--bdr);border-radius:var(--r);background:var(--card);width:100%;max-width:400px;outline:none}.sb:focus{border-color:var(--acc);box-shadow:0 0 0 2px rgba(198,93,40,.1)}
</style>
</head>
<body>
<div class="tb"><div class="tb-logo">The <span>Community</span> Exchange</div><div class="tb-nav"><button onclick="nav('home')" id="n-home" class="on">Home</button><button onclick="nav('pathways')" id="n-pathways">Pathways</button><button onclick="nav('help')" id="n-help">I Need Help</button><button onclick="nav('officials')" id="n-officials">Who's In Charge</button><button onclick="nav('dashboard')" id="n-dashboard">Dashboard</button></div></div>
<div id="app"><div class="ld">Loading your community...</div></div>
<div class="ov" id="ov" onclick="cp()"></div>
<div class="dp" id="dp"><button class="dpx" onclick="cp()">x</button><div id="pb"></div></div>
<script src="${FUNCTIONS_BASE}/ce-config"><\/script>
<script src="${FUNCTIONS_BASE}/ce-home"><\/script>
<script src="${FUNCTIONS_BASE}/ce-help"><\/script>
<script src="${FUNCTIONS_BASE}/ce-officials"><\/script>
<script src="${FUNCTIONS_BASE}/ce-pathways"><\/script>
<script src="${FUNCTIONS_BASE}/ce-dashboard"><\/script>
<script>
function nav(p){document.querySelectorAll('.tb-nav button').forEach(function(b){b.classList.remove('on')});var b=document.getElementById('n-'+p);if(b)b.classList.add('on');var a=document.getElementById('app');a.innerHTML='<div class="ld">Loading...</div>';switch(p){case 'home':renderHome(a);break;case 'pathways':renderPathways(a);break;case 'help':renderHelp(a);break;case 'officials':renderOfficials(a);break;case 'dashboard':renderDashboard(a);break;default:renderHome(a)}}
function op(t,h_){document.getElementById('pb').innerHTML='<h2 style="font-family:var(--ser);font-size:20px;margin-bottom:16px;padding-right:30px">'+t+'</h2>'+h_;document.getElementById('dp').classList.add('open');document.getElementById('ov').classList.add('show')}
function cp(){document.getElementById('dp').classList.remove('open');document.getElementById('ov').classList.remove('show')}
nav('home');
<\/script>
</body>
</html>`;

Deno.serve(() => new Response(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
}));
