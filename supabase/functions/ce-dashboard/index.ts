import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const js = `
async function renderDashboard(el){
  var [th,fa,orgs,offs,svcs,evs,camps,res,sits,bens,paths,co]=await Promise.all([q('themes'),q('focus_areas'),q('organizations','*',{},{limit:200}),q('elected_officials'),q('services_211','*',{},{limit:200}),q('events'),q('campaigns'),q('resources','*',{},{limit:400}),q('life_situations'),q('benefit_programs'),q('learning_paths'),q('counties')]);
  var o='<div style="margin-bottom:28px"><h1 style="font-family:var(--ser);font-size:28px;font-weight:600;margin-bottom:6px">Community Dashboard</h1><p style="font-family:var(--ser);font-size:14px;color:var(--mid);font-style:italic">Everything we know about Greater Houston, by the numbers.</p></div>';
  var bn=[{n:res.length,l:'Resources',c:'var(--acc)'},{n:offs.length,l:'Officials',c:'var(--T4)'},{n:svcs.length,l:'Services',c:'var(--teal)'},{n:orgs.length,l:'Organizations',c:'var(--T5)'},{n:evs.length,l:'Events',c:'var(--T2)'},{n:camps.length,l:'Campaigns',c:'var(--T1)'},{n:sits.length,l:'Life Situations',c:'var(--T3)'},{n:bens.length,l:'Benefits',c:'var(--T6)'},{n:paths.length,l:'Learning Paths',c:'var(--T7)'},{n:fa.length,l:'Focus Areas',c:'var(--mid)'},{n:co.length,l:'Counties',c:'var(--lt)'},{n:th.length,l:'Pathways',c:'var(--navy)'}];
  o+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">';bn.forEach(function(s){o+='<div class="c" style="text-align:center;padding:16px 10px"><div style="font-family:var(--ser);font-size:26px;font-weight:700;color:'+s.c+'">'+s.n+'</div><div style="font-size:11px;color:var(--lt);margin-top:2px">'+s.l+'</div></div>'});o+='</div>';
  o+='<div class="sh"><h2>Content by pathway</h2></div><div style="margin-bottom:28px">';
  th.sort(function(a,b){return a.theme_id<b.theme_id?-1:1});
  th.forEach(function(t){
    var tid=t.theme_id,c=themeColor(tid);
    var fc=fa.filter(function(f){return f.theme_id===tid}).length;
    var rc=res.filter(function(r){return r.focus_area_ids&&r.focus_area_ids.indexOf(tid)>=0}).length;
    var sc=svcs.filter(function(s){return s.focus_area_ids&&s.focus_area_ids.indexOf(tid)>=0}).length;
    var cc=camps.filter(function(x){return x.theme_id===tid}).length;
    o+='<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--cream2)"><div style="width:8px;height:8px;border-radius:50%;background:'+c+';flex-shrink:0"></div><div style="min-width:140px;font-weight:600;font-size:13px;color:'+c+'">'+h(t.theme_name)+'</div><div style="flex:1;display:flex;gap:16px;font-size:12px;color:var(--lt)"><span>'+fc+' focus areas</span><span>'+rc+' resources</span><span>'+sc+' services</span><span>'+cc+' campaigns</span></div></div>';
  });
  o+='</div>';
  var ac=camps.filter(function(c){return c.status==='Active'});
  if(ac.length){
    o+='<div class="sh"><h2>Campaign progress</h2><span class="sub">'+ac.length+' active</span></div><div style="display:flex;flex-direction:column;gap:10px;margin-bottom:28px">';
    ac.forEach(function(c){
      var p=pct(c.current_value,c.target_value),cl=themeColor(c.theme_id);
      o+='<div class="c" style="padding:14px 18px"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px"><div style="font-weight:600;font-size:13px">'+h(c.campaign_name)+'</div><div style="font-size:11px;color:var(--lt)">'+p+'%</div></div><div class="prog"><div class="prog-fill" style="width:'+p+'%;background:'+cl+'"></div></div><div style="font-size:11px;color:var(--lt);display:flex;justify-content:space-between;margin-top:4px"><span>'+(c.participant_count||0)+' participants</span><span>'+h(c.target_metric||'')+': '+(c.current_value||0)+' / '+(c.target_value||'?')+'</span></div></div>';
    });
    o+='</div>';
  }
  var up=evs.filter(function(e){return e.start_datetime&&new Date(e.start_datetime)>new Date()}).sort(function(a,b){return new Date(a.start_datetime)-new Date(b.start_datetime)}).slice(0,8);
  if(up.length){
    o+='<div class="sh"><h2>Upcoming events</h2></div><div class="g2" style="margin-bottom:28px">';
    up.forEach(function(e){o+='<div class="c"><div style="font-size:11px;font-weight:700;color:var(--acc);margin-bottom:4px">'+fmtDate(e.start_datetime)+'</div><div style="font-weight:600;font-size:13px;margin-bottom:4px">'+h(e.event_name)+'</div><div style="font-size:12px;color:var(--lt)">'+trunc(e.description_5th_grade,60)+'</div>'+(e.city?'<div style="font-size:11px;color:var(--lt);margin-top:4px">'+h(e.city)+(e.is_virtual==='Yes'?' &middot; Virtual':'')+(e.is_free==='Yes'?' &middot; Free':'')+'</div>':'')+'</div>'});
    o+='</div>';
  }
  o+='<div class="sh"><h2>Geographic coverage</h2></div><div class="g3" style="margin-bottom:20px">';
  [{n:co.length,l:'Counties'},{n:238,l:'Zip codes'},{n:50,l:'Neighborhoods'},{n:50,l:'Census tracts'},{n:40,l:'Precincts'},{n:40,l:'School districts'}].forEach(function(g){o+='<div class="c" style="text-align:center;padding:14px"><div style="font-family:var(--ser);font-size:22px;font-weight:700;color:var(--teal)">'+g.n+'</div><div style="font-size:11px;color:var(--lt)">'+g.l+'</div></div>'});
  o+='</div>';
  el.innerHTML=o;
}
`;
Deno.serve(()=>new Response(js,{headers:{'Content-Type':'application/javascript','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}}));
