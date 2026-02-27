import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const js = `
async function renderHelp(el){
  var [sits,svcs,bens,cats]=await Promise.all([q('life_situations','*',{},{order:'display_order'}),q('services_211','*',{},{limit:100}),q('benefit_programs','*',{},{limit:20}),q('service_categories')]);
  var o='<div style="margin-bottom:28px"><h1 style="font-family:var(--ser);font-size:28px;font-weight:600;margin-bottom:6px">I need help with...</h1><p style="font-family:var(--ser);font-size:14px;color:var(--mid);font-style:italic">You are not alone. Pick what you are going through and we will show you what is available.</p></div>';
  o+='<div style="margin-bottom:24px"><input class="sb" id="svc-s" placeholder="Search services, benefits, or situations..." oninput="fltHelp()" /></div>';
  var uo=['Critical','High','Medium','Low'];
  o+='<div id="help-sits">';
  uo.forEach(function(u){
    var g=sits.filter(function(s){return s.urgency_level===u});if(!g.length)return;
    o+='<div class="sh"><h2>'+u+' priority</h2><span class="sub">'+g.length+' situations</span></div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">';
    g.forEach(function(s){
      var uc=u==='Critical'?'uc':u==='High'?'uh':u==='Medium'?'um':'ul';
      o+='<div class="c ck sc" data-n="'+h(s.situation_name).toLowerCase()+'" style="display:flex;align-items:center;gap:14px;padding:12px 16px" onclick="showSit(\\''+s.situation_id+'\\')\"><span class="tag '+uc+'" style="min-width:60px;text-align:center">'+u+'</span><div style="flex:1"><div style="font-family:var(--ser);font-size:14px;font-weight:600">'+h(s.situation_name)+'</div><div style="font-size:12px;color:var(--lt);margin-top:2px">'+trunc(s.description_5th_grade,70)+'</div></div><div style="color:var(--lt2)">&#8250;</div></div>';
    });
    o+='</div>';
  });
  o+='</div>';
  o+='<div class="sh"><h2>Benefit programs</h2><span class="sub">'+bens.length+' programs</span></div><div class="g2" style="margin-bottom:28px" id="help-bens">';
  bens.forEach(function(b){
    o+='<div class="c bc" data-n="'+h(b.benefit_name).toLowerCase()+'">';
    o+='<div style="font-family:var(--ser);font-size:14px;font-weight:600;margin-bottom:4px">'+h(b.benefit_name)+'</div>';
    if(b.benefit_type)o+='<div style="font-size:11px;color:var(--teal);font-weight:600;margin-bottom:6px">'+h(b.benefit_type)+'</div>';
    o+='<div style="font-size:12px;color:var(--mid);margin-bottom:8px">'+trunc(b.description_5th_grade,80)+'</div>';
    if(b.eligibility_summary)o+='<div style="font-size:11px;color:var(--lt);margin-bottom:4px"><strong>Eligibility:</strong> '+trunc(b.eligibility_summary,60)+'</div>';
    if(b.application_url)o+='<a href="'+h(b.application_url)+'" target="_blank" style="font-size:11px;color:var(--acc);font-weight:600">Apply here &#8250;</a>';
    o+='</div>';
  });
  o+='</div>';
  o+='<div class="sh"><h2>All services</h2><span class="sub">'+svcs.length+' services from 211</span></div><div id="help-svcs">';
  cats.forEach(function(cat){
    var cs=svcs.filter(function(s){return s.service_cat_id===cat.service_cat_id});if(!cs.length)return;
    o+='<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:var(--acc);margin-bottom:8px">'+h(cat.service_cat_name)+' ('+cs.length+')</div>';
    cs.slice(0,5).forEach(function(s){
      o+='<div class="vc" data-n="'+h(s.service_name).toLowerCase()+'" style="padding:8px 0;border-bottom:1px solid var(--cream2);cursor:pointer" onclick="showSvc(\\''+s.service_id+'\\')\"><div style="font-weight:600;font-size:13px">'+h(s.service_name)+'</div><div style="font-size:12px;color:var(--lt);margin-top:2px">'+trunc(s.description_5th_grade,70)+'</div></div>';
    });
    if(cs.length>5)o+='<div style="font-size:11px;color:var(--lt);padding:6px 0">+ '+(cs.length-5)+' more</div>';
    o+='</div>';
  });
  o+='</div>';
  el.innerHTML=o;
}
function fltHelp(){var t=(document.getElementById('svc-s').value||'').toLowerCase();document.querySelectorAll('.sc,.bc,.vc').forEach(function(e){var n=e.getAttribute('data-n')||'';e.style.display=(t===''||n.indexOf(t)>=0)?'':'none'})}
async function showSvc(id){
  var d=await q('services_211','*',{service_id:id});if(!d.length)return;var s=d[0];
  var org=null;if(s.org_id){var od=await q('organizations','*',{org_id:s.org_id});if(od.length)org=od[0]}
  var h_='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(s.description_5th_grade)+'</p>';
  var ct=[];if(s.phone)ct.push({l:'Phone',v:h(s.phone)});if(s.website)ct.push({l:'Website',v:'<a href="'+h(s.website)+'" target="_blank" style="color:var(--acc)">'+trunc(s.website,40)+'</a>'});if(s.address)ct.push({l:'Address',v:h(s.address)+(s.city?', '+h(s.city):'')});if(s.hours)ct.push({l:'Hours',v:h(s.hours)});if(s.eligibility)ct.push({l:'Eligibility',v:h(s.eligibility)});if(s.fees)ct.push({l:'Fees',v:h(s.fees)});if(s.languages)ct.push({l:'Languages',v:h(s.languages)});
  ct.forEach(function(c){h_+='<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--cream2);font-size:13px"><div style="min-width:90px;font-weight:600;color:var(--lt);font-size:11px;text-transform:uppercase;padding-top:2px">'+c.l+'</div><div>'+c.v+'</div></div>'});
  if(org){h_+='<div style="margin-top:16px;padding:12px;background:var(--cream);border-radius:var(--r)"><div style="font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">Provided by</div><div style="font-weight:600;font-size:14px">'+h(org.org_name)+'</div>'+(org.website?'<a href="'+h(org.website)+'" target="_blank" style="font-size:12px;color:var(--acc);margin-top:4px;display:inline-block">'+trunc(org.website,40)+'</a>':'')+'</div>'}
  op(s.service_name,h_);
}
`;
Deno.serve(()=>new Response(js,{headers:{'Content-Type':'application/javascript','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}}));
