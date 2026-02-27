import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const js = `
async function renderHome(el){
  var [themes,sits,camps,stories,events]=await Promise.all([q('themes'),q('life_situations','*',{},{order:'display_order',limit:25}),q('campaigns','*',{},{limit:20}),q('success_stories','*',{},{limit:10}),q('events','*',{},{limit:10})]);
  var crit=sits.filter(function(s){return s.urgency_level==='Critical'||s.urgency_level==='High'}).slice(0,5);
  var ac=camps.filter(function(c){return c.status==='Active'}).slice(0,4);
  var fs=stories.filter(function(s){return s.is_featured==='Yes'}).slice(0,3);
  var o='';
  o+='<div style="margin-bottom:32px"><h1 style="font-family:var(--ser);font-size:28px;font-weight:600;margin-bottom:6px">What brought you here today?</h1><p style="font-family:var(--ser);font-size:14px;color:var(--mid);font-style:italic">Your community has more going on than you think. Pick a door.</p></div>';
  o+='<div class="g3" style="margin-bottom:32px">';
  [{i:'&#128591;',t:'I need help',s:'Services, benefits, support',p:'help'},{i:'&#9994;',t:'I want to give back',s:'Volunteer, donate, mentor',p:'pathways'},{i:'&#127963;',t:"Who\\'s in charge?",s:'Officials, policies, votes',p:'officials'},{i:'&#128197;',t:"What\\'s happening",s:'Events and campaigns',p:'dashboard'},{i:'&#128270;',t:'Just looking',s:'Explore all 7 pathways',p:'pathways'}].forEach(function(d){
    o+='<div class="c ck" style="text-align:center;padding:24px" onclick="nav(\\''+d.p+'\\')"><div style="font-size:28px;margin-bottom:8px">'+d.i+'</div><h3 style="font-family:var(--ser);font-size:15px;margin-bottom:3px">'+d.t+'</h3><p style="font-size:11px;color:var(--lt)">'+d.s+'</p></div>';
  });
  o+='</div>';
  if(crit.length){
    o+='<div class="sh"><h2>Right now, people need...</h2></div><div style="display:flex;flex-direction:column;gap:10px;margin-bottom:32px">';
    crit.forEach(function(s){
      var uc=s.urgency_level==='Critical'?'uc':'uh';
      o+='<div class="c ck pw-'+(s.theme_id||'')+'" style="display:flex;align-items:center;gap:14px;padding:14px 18px" onclick="showSit(\\''+s.situation_id+'\\')">';
      o+='<span class="tag '+uc+'">'+h(s.urgency_level)+'</span><div style="flex:1"><div style="font-family:var(--ser);font-size:15px;font-weight:600">'+h(s.situation_name)+'</div><div style="font-size:12px;color:var(--lt);margin-top:2px">'+trunc(s.description_5th_grade,80)+'</div></div><div style="color:var(--lt2);font-size:18px">&#8250;</div></div>';
    });
    o+='</div>';
  }
  if(ac.length){
    o+='<div class="sh"><h2>Active campaigns</h2><span class="sub">'+ac.length+' underway</span></div><div class="g2" style="margin-bottom:32px">';
    ac.forEach(function(c){
      var p=pct(c.current_value,c.target_value),co=themeColor(c.theme_id);
      o+='<div class="c ck" onclick="showCamp(\\''+c.campaign_id+'\\')">';
      o+='<div style="font-size:10px;font-weight:700;color:'+co+';letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">'+themeName(c.theme_id)+'</div>';
      o+='<div style="font-family:var(--ser);font-size:15px;font-weight:600;margin-bottom:6px">'+h(c.campaign_name)+'</div>';
      o+='<div style="font-size:12px;color:var(--mid);margin-bottom:8px">'+trunc(c.description_5th_grade,90)+'</div>';
      o+='<div class="prog"><div class="prog-fill" style="width:'+p+'%;background:'+co+'"></div></div>';
      o+='<div style="font-size:11px;color:var(--lt);display:flex;justify-content:space-between"><span>'+(c.participant_count||0)+' participants</span><span>'+p+'%</span></div></div>';
    });
    o+='</div>';
  }
  if(fs.length){
    o+='<div class="sh"><h2>Community stories</h2></div><div class="g3" style="margin-bottom:32px">';
    fs.forEach(function(s){
      o+='<div class="c"><div style="font-family:var(--ser);font-size:15px;font-weight:600;margin-bottom:6px">'+h(s.story_title)+'</div>';
      if(s.quote)o+='<div style="font-family:var(--ser);font-style:italic;font-size:13px;color:var(--mid);margin-bottom:8px;border-left:2px solid var(--acc);padding-left:10px">"'+trunc(s.quote,100)+'"</div>';
      if(s.person_name)o+='<div style="font-size:11px;color:var(--lt)">\\u2014 '+h(s.person_name)+(s.person_neighborhood?', '+h(s.person_neighborhood):'')+'</div>';
      o+='</div>';
    });
    o+='</div>';
  }
  o+='<div class="sh"><h2>By the numbers</h2></div><div style="display:flex;gap:20px;flex-wrap:wrap">';
  [{n:themes.length,l:'Pathways'},{n:sits.length,l:'Life situations'},{n:camps.length,l:'Campaigns'},{n:events.length,l:'Events'}].forEach(function(s){
    o+='<div style="text-align:center;padding:12px 20px"><div style="font-family:var(--ser);font-size:28px;font-weight:700;color:var(--acc)">'+s.n+'</div><div style="font-size:11px;color:var(--lt)">'+s.l+'</div></div>';
  });
  o+='</div>';
  el.innerHTML=o;
}
async function showSit(id){
  var d=await q('life_situations','*',{situation_id:id});if(!d.length)return;var s=d[0];
  var uc=s.urgency_level==='Critical'?'uc':s.urgency_level==='High'?'uh':'um';
  var h_='<span class="tag '+uc+'" style="margin-bottom:12px;display:inline-block">'+h(s.urgency_level)+' priority</span>';
  h_+='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(s.description_5th_grade)+'</p>';
  if(s.service_cat_ids){
    var cats=s.service_cat_ids.split(',').map(function(x){return x.trim()});
    var svcs=await q('services_211','*',{},{limit:50});
    var m=svcs.filter(function(v){return cats.some(function(c){return v.service_cat_id===c})}).slice(0,6);
    if(m.length){h_+='<div style="margin-top:16px;font-size:11px;font-weight:700;color:var(--acc);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Related services</div>';m.forEach(function(v){h_+='<div style="padding:10px 0;border-bottom:1px solid var(--cream2)"><div style="font-weight:600;font-size:13px">'+h(v.service_name)+'</div><div style="font-size:12px;color:var(--mid);margin-top:2px">'+trunc(v.description_5th_grade,100)+'</div>'+(v.phone?'<div style="font-size:11px;color:var(--teal);margin-top:4px">'+h(v.phone)+'</div>':'')+'</div>'})}
  }
  op(s.situation_name,h_);
}
async function showCamp(id){
  var d=await q('campaigns','*',{campaign_id:id});if(!d.length)return;var c=d[0];
  var p=pct(c.current_value,c.target_value),co=themeColor(c.theme_id);
  var h_='<div style="font-size:10px;font-weight:700;color:'+co+';letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">'+themeName(c.theme_id)+'</div>';
  h_+='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(c.description_5th_grade)+'</p>';
  if(c.goal_description)h_+='<div style="background:var(--cream);padding:12px;border-radius:var(--r);margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:var(--lt);margin-bottom:4px">GOAL</div><div style="font-size:13px">'+h(c.goal_description)+'</div></div>';
  h_+='<div class="prog" style="height:8px"><div class="prog-fill" style="width:'+p+'%;background:'+co+'"></div></div>';
  h_+='<div style="font-size:12px;color:var(--lt);display:flex;justify-content:space-between;margin-bottom:16px"><span>'+(c.participant_count||0)+' participants</span><span>'+p+'% of goal</span></div>';
  op(c.campaign_name,h_);
}
`;
Deno.serve(()=>new Response(js,{headers:{'Content-Type':'application/javascript','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}}));
