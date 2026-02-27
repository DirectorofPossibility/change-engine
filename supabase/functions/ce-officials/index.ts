import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const js = `
async function renderOfficials(el){
  var [offs,gl,pols]=await Promise.all([q('elected_officials'),q('government_levels','*',{},{order:'level_order'}),q('policies','*',{},{limit:30})]);
  var o='<div style="margin-bottom:28px"><h1 style="font-family:var(--ser);font-size:28px;font-weight:600;margin-bottom:6px">Who Represents You</h1><p style="font-family:var(--ser);font-size:14px;color:var(--mid);font-style:italic">'+offs.length+' elected officials across '+gl.length+' levels of government</p></div>';
  o+='<input class="sb" id="off-s" placeholder="Search by name, title, or district..." oninput="fltOff()" style="margin-bottom:24px" />';
  o+='<div id="off-list">';
  gl.forEach(function(g){
    var grp=offs.filter(function(o){return o.gov_level_id===g.gov_level_id});if(!grp.length)return;
    grp.sort(function(a,b){return(a.official_name||'').localeCompare(b.official_name||'')});
    o+='<div class="sh"><h2>'+h(g.gov_level_name)+'</h2><span class="sub">'+grp.length+' officials</span></div><div style="margin-bottom:20px"><table class="tbl"><thead><tr><th>Name</th><th>Title</th><th>Party</th><th>District</th><th>Phone</th></tr></thead><tbody>';
    grp.forEach(function(f){
      o+='<tr class="or" data-n="'+h(f.official_name+' '+f.title+' '+f.jurisdiction).toLowerCase()+'" style="cursor:pointer" onclick="showOff(\\''+f.official_id+'\\')">';
      o+='<td style="font-weight:600">'+h(f.official_name)+'</td><td>'+h(f.title)+'</td><td>'+h(f.party||'\\u2014')+'</td><td style="font-size:12px;color:var(--lt)">'+h(f.jurisdiction||f.district_id||'\\u2014')+'</td><td style="font-size:12px;color:var(--teal)">'+h(f.office_phone||'\\u2014')+'</td></tr>';
    });
    o+='</tbody></table></div>';
  });
  o+='</div>';
  var rp=pols.slice(0,10);
  if(rp.length){
    o+='<div class="sh"><h2>Policies and legislation</h2><span class="sub">'+pols.length+' tracked</span></div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:28px">';
    rp.forEach(function(p){
      var sc=p.status==='Enacted'?'#2E7D32':p.status==='Introduced'?'#E65100':'var(--lt)';
      o+='<div class="c ck" style="display:flex;align-items:center;gap:12px;padding:12px 16px" onclick="showPol(\\''+p.policy_id+'\\')">';
      o+='<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;background:'+sc+'18;color:'+sc+'">'+h(p.status)+'</span>';
      o+='<div style="flex:1"><div style="font-size:13px;font-weight:600">'+h(p.policy_name)+'</div><div style="font-size:11px;color:var(--lt)">'+h(p.level||'')+(p.bill_number?' &middot; '+h(p.bill_number):'')+'</div></div>';
      o+='<div style="color:var(--lt2)">&#8250;</div></div>';
    });
    o+='</div>';
  }
  el.innerHTML=o;
}
function fltOff(){var t=(document.getElementById('off-s').value||'').toLowerCase();document.querySelectorAll('.or').forEach(function(e){var n=e.getAttribute('data-n')||'';e.style.display=(t===''||n.indexOf(t)>=0)?'':'none'})}
async function showOff(id){
  var d=await q('elected_officials','*',{official_id:id});if(!d.length)return;var o=d[0];
  var h_='<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px"><div style="width:48px;height:48px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-family:var(--ser);font-size:20px;font-weight:700;color:var(--lt)">'+(o.official_name||'?')[0]+'</div><div><div style="font-size:13px;color:var(--mid)">'+h(o.title)+'</div>'+(o.party?'<div style="font-size:12px;color:var(--lt)">'+h(o.party)+'</div>':'')+'</div></div>';
  var dt=[];if(o.jurisdiction)dt.push({l:'Jurisdiction',v:h(o.jurisdiction)});if(o.district_type)dt.push({l:'District',v:h((o.district_type||'')+' '+(o.district_id||''))});if(o.counties_served)dt.push({l:'Counties',v:h(o.counties_served)});if(o.office_phone)dt.push({l:'Phone',v:h(o.office_phone)});if(o.email)dt.push({l:'Email',v:h(o.email)});if(o.website)dt.push({l:'Website',v:'<a href="'+h(o.website)+'" target="_blank" style="color:var(--acc)">'+trunc(o.website,40)+'</a>'});if(o.term_end)dt.push({l:'Term ends',v:h(o.term_end)});
  dt.forEach(function(d){h_+='<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--cream2);font-size:13px"><div style="min-width:80px;font-weight:600;color:var(--lt);font-size:11px;text-transform:uppercase;padding-top:2px">'+d.l+'</div><div>'+d.v+'</div></div>'});
  if(o.description_5th_grade)h_+='<div style="margin-top:16px;padding:12px;background:var(--cream);border-radius:var(--r);font-size:13px;color:var(--mid);line-height:1.6">'+h(o.description_5th_grade)+'</div>';
  op(o.official_name,h_);
}
async function showPol(id){
  var d=await q('policies','*',{policy_id:id});if(!d.length)return;var p=d[0];
  var sc=p.status==='Enacted'?'#2E7D32':p.status==='Introduced'?'#E65100':'var(--lt)';
  var h_='<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;background:'+sc+'18;color:'+sc+';display:inline-block;margin-bottom:12px">'+h(p.status)+'</span>';
  h_+='<p style="font-size:14px;color:var(--mid);margin-bottom:16px;line-height:1.6">'+h(p.summary_5th_grade)+'</p>';
  var mt=[];if(p.level)mt.push({l:'Level',v:h(p.level)});if(p.policy_type)mt.push({l:'Type',v:h(p.policy_type)});if(p.bill_number)mt.push({l:'Bill #',v:h(p.bill_number)});if(p.introduced_date)mt.push({l:'Introduced',v:fmtDate(p.introduced_date)});if(p.last_action)mt.push({l:'Last action',v:h(p.last_action)});if(p.source_url)mt.push({l:'Source',v:'<a href="'+h(p.source_url)+'" target="_blank" style="color:var(--acc)">View full text</a>'});
  mt.forEach(function(m){h_+='<div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid var(--cream2);font-size:13px"><div style="min-width:80px;font-weight:600;color:var(--lt);font-size:11px;text-transform:uppercase">'+m.l+'</div><div>'+m.v+'</div></div>'});
  op(p.policy_name,h_);
}
`;
Deno.serve(()=>new Response(js,{headers:{'Content-Type':'application/javascript','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}}));
