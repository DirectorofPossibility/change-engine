import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const js = `
async function renderPathways(el){
  var [themes,fa,res,paths]=await Promise.all([q('themes'),q('focus_areas'),q('resources','*',{},{limit:50}),q('learning_paths','*',{},{order:'display_order'})]);
  themes.sort(function(a,b){return a.theme_id<b.theme_id?-1:1});
  var o='<div style="margin-bottom:28px"><h1 style="font-family:var(--ser);font-size:28px;font-weight:600;margin-bottom:6px">Seven Pathways to Change</h1><p style="font-family:var(--ser);font-size:14px;color:var(--mid);font-style:italic">Every big change starts small. Pick the pathway that feels right.</p></div>';
  themes.forEach(function(t){
    var tid=t.theme_id,co=themeColor(tid);
    var fas=fa.filter(function(f){return f.theme_id===tid});
    var pp=paths.filter(function(p){return p.theme_id===tid});
    o+='<div class="c pw-'+tid+'" style="margin-bottom:16px;padding:0;overflow:hidden">';
    o+='<div style="padding:18px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="togPW(\\''+tid+'\\')">';
    o+='<div><div style="font-family:var(--ser);font-size:19px;font-weight:600;color:'+co+'">'+h(t.theme_name)+'</div>';
    o+='<div style="font-size:12px;color:var(--lt);margin-top:2px">'+fas.length+' focus areas &middot; '+pp.length+' learning paths</div></div>';
    o+='<div id="ar-'+tid+'" style="font-size:18px;color:var(--lt);transition:.2s">&#9660;</div></div>';
    o+='<div id="bd-'+tid+'" style="display:none;padding:0 20px 18px;border-top:1px solid var(--cream2)">';
    if(fas.length){
      o+='<div style="margin-top:14px;font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Focus Areas</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">';
      fas.forEach(function(f){o+='<span style="font-size:11px;padding:3px 10px;background:'+co+'10;color:'+co+';border-radius:3px;font-weight:500;cursor:pointer" onclick="showFA(\\''+f.focus_id+'\\')">'+h(f.focus_area_name)+'</span>'});
      o+='</div>';
    }
    if(pp.length){
      o+='<div style="font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Learning Paths</div>';
      pp.forEach(function(p){o+='<div style="padding:8px 12px;background:var(--cream);border-radius:4px;margin-bottom:6px;cursor:pointer" onclick="showPath(\\''+p.path_id+'\\')"><div style="font-weight:600;font-size:13px">'+h(p.path_name)+'</div><div style="font-size:11px;color:var(--lt);margin-top:2px">'+(p.module_count||0)+' modules &middot; '+(p.estimated_minutes||0)+' min &middot; '+(p.difficulty_level||'Beginner')+'</div></div>'});
    }
    o+='</div></div>';
  });
  el.innerHTML=o;
}
function togPW(tid){var b=document.getElementById('bd-'+tid),a=document.getElementById('ar-'+tid);if(b.style.display==='none'){b.style.display='block';a.innerHTML='&#9650;'}else{b.style.display='none';a.innerHTML='&#9660;'}}
async function showFA(id){
  var d=await q('focus_areas','*',{focus_id:id});if(!d.length)return;var f=d[0],co=themeColor(f.theme_id);
  var h_='<div style="font-size:10px;font-weight:700;color:'+co+';letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">'+themeName(f.theme_id)+'</div>';
  if(f.description)h_+='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(f.description)+'</p>';
  var refs=[];if(f.sdg_id)refs.push({l:'SDG',v:f.sdg_id});if(f.sdoh_code)refs.push({l:'SDOH',v:f.sdoh_code});if(f.ntee_code)refs.push({l:'NTEE',v:f.ntee_code});if(f.airs_code)refs.push({l:'AIRS',v:f.airs_code});
  if(refs.length){h_+='<div style="font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin:16px 0 8px">Cross-references</div>';refs.forEach(function(r){h_+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cream2);font-size:12px"><span style="color:var(--lt)">'+r.l+'</span><span style="font-weight:600">'+h(r.v)+'</span></div>'})}
  var res=await q('resources','*',{},{limit:100});var rel=res.filter(function(r){return r.focus_area_ids&&r.focus_area_ids.indexOf(id)>=0}).slice(0,6);
  if(rel.length){h_+='<div style="font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin:16px 0 8px">Resources ('+rel.length+')</div>';rel.forEach(function(r){h_+='<div style="padding:8px 0;border-bottom:1px solid var(--cream2)"><div style="font-weight:600;font-size:13px">'+h(r.resource_name)+'</div><div style="font-size:12px;color:var(--mid);margin-top:2px">'+trunc(r.description_5th_grade,80)+'</div>'+(r.source_url?'<a href="'+h(r.source_url)+'" target="_blank" style="font-size:11px;color:var(--acc);margin-top:3px;display:inline-block">View resource</a>':'')+'</div>'})}
  op(f.focus_area_name,h_);
}
async function showPath(id){
  var d=await q('learning_paths','*',{path_id:id});if(!d.length)return;var p=d[0];
  var mods=await q('learning_modules','*',{path_id:id},{order:'module_order'});var co=themeColor(p.theme_id);
  var h_='<div style="font-size:10px;font-weight:700;color:'+co+';letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">'+themeName(p.theme_id)+'</div>';
  h_+='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(p.description_5th_grade)+'</p>';
  h_+='<div style="display:flex;gap:16px;margin-bottom:16px;font-size:12px;color:var(--lt)"><span>'+(p.module_count||0)+' modules</span><span>'+(p.estimated_minutes||0)+' min</span><span>'+(p.difficulty_level||'Beginner')+'</span></div>';
  if(mods.length){h_+='<div style="font-size:11px;font-weight:700;color:var(--lt);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Modules</div>';mods.forEach(function(m,i){h_+='<div style="padding:10px 12px;background:var(--cream);border-radius:4px;margin-bottom:6px"><div style="font-weight:600;font-size:13px"><span style="color:var(--lt);margin-right:6px">'+(i+1)+'.</span>'+h(m.module_name)+'</div><div style="font-size:12px;color:var(--mid);margin-top:2px">'+trunc(m.description_5th_grade,80)+'</div><div style="font-size:11px;color:var(--lt);margin-top:4px">'+(m.estimated_minutes||0)+' min'+(m.has_quiz==='Yes'?' &middot; Has quiz':'')+'</div></div>'})}
  op(p.path_name,h_);
}
`;
Deno.serve(()=>new Response(js,{headers:{'Content-Type':'application/javascript','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}}));
