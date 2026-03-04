import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SB = Deno.env.get('SUPABASE_URL')!;
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AK = Deno.env.get('ANTHROPIC_API_KEY')!;
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};

async function db(p:string){const r=await fetch(`${SB}/rest/v1/${p}`,{headers:{apikey:SK,Authorization:`Bearer ${SK}`}});return r.json();}
async function patch(t:string,m:string,b:any){await fetch(`${SB}/rest/v1/${t}?${m}`,{method:'PATCH',headers:{apikey:SK,Authorization:`Bearer ${SK}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(b)});}

Deno.serve(async(req:Request)=>{
if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
try{
const body=await req.json().catch(()=>({}));
const table=body.table||'organizations';
const batch=Math.min(body.batch_size||1,3);

const [themes,fas,segs,sits,rts,scs]=await Promise.all([
  db('themes?select=theme_id,theme_name&limit=50'),
  db('focus_areas?select=focus_id,focus_area_name,theme_id&limit=500'),
  db('audience_segments?select=segment_id,segment_name&limit=50'),
  db('life_situations?select=situation_id,situation_name&limit=50'),
  db('resource_types?select=resource_type_id,resource_type_name,center&limit=50'),
  db('service_categories?select=service_cat_id,service_cat_name&limit=50'),
]);

const th=themes.map((t:any)=>`${t.theme_id}=${t.theme_name}`).join(', ');
const byT:Record<string,string[]>={};
for(const f of fas){const k=f.theme_id||'X';if(!byT[k])byT[k]=[];byT[k].push(`${f.focus_id}=${f.focus_area_name}`);}
let ft='';for(const[k,v]of Object.entries(byT)){ft+=`${k}: ${v.join(', ')}\n`;}
const sg=segs.map((s:any)=>`${s.segment_id}=${s.segment_name}`).join(', ');
const si=sits.map((s:any)=>`${s.situation_id}=${s.situation_name}`).join(', ');
const rt=rts.map((r:any)=>`${r.resource_type_id}=${r.resource_type_name}(${r.center})`).join(', ');
const sc=scs.map((s:any)=>`${s.service_cat_id}=${s.service_cat_name}`).join(', ');

const sysPrompt=`Change Engine v2 classifier. Houston TX civic content. Use ONLY these IDs.
THEMES: ${th}
FOCUS AREAS by theme:
${ft}
SEGMENTS: ${sg}
SITUATIONS: ${si}
RESOURCE TYPES: ${rt}
SERVICE CATS: ${sc}
CENTERS: Learning|Action|Resource|Accountability
Return JSON only.`;

const cfgs:Record<string,{pk:string,nm:string,desc:string,extra:string[]}>=({
  organizations:{pk:'org_id',nm:'org_name',desc:'description_5th_grade',extra:['mission_statement','website']},
  resources:{pk:'resource_id',nm:'resource_name',desc:'description_5th_grade',extra:['source_url','content_format']},
  services_211:{pk:'service_id',nm:'service_name',desc:'description_5th_grade',extra:['org_id']},
  policies:{pk:'policy_id',nm:'policy_name',desc:'summary_5th_grade',extra:['policy_type','level','status','bill_number']},
  opportunities:{pk:'opportunity_id',nm:'opportunity_name',desc:'description_5th_grade',extra:['org_id']},
  elected_officials:{pk:'official_id',nm:'official_name',desc:'description_5th_grade',extra:['title','level','party']},
});
const cfg=cfgs[table];if(!cfg)return new Response(JSON.stringify({error:'bad table'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}});

const cols=[cfg.pk,cfg.nm,cfg.desc,...cfg.extra,'focus_area_ids'].join(',');
let q=`${table}?select=${cols}&classification_v2=is.null&order=${cfg.pk}.asc&limit=${batch}`;
if(body.start_from)q+=`&${cfg.pk}=gte.${body.start_from}`;
const items=await db(q);
if(!items||!items.length)return new Response(JSON.stringify({success:true,message:`All ${table} done!`}),{headers:{...CORS,'Content-Type':'application/json'}});

const faLookup=new Map(fas.map((f:any)=>[f.focus_id,f]));
const results:any[]=[];
for(const item of items){
  const id=item[cfg.pk],name=item[cfg.nm]||'?';
  try{
    const parts=[`Name: ${name}`];if(item[cfg.desc])parts.push(`Desc: ${item[cfg.desc]}`);for(const c of cfg.extra){if(item[c])parts.push(`${c}: ${String(item[c]).substring(0,200)}`);}
    if(item.focus_area_ids)parts.push(`Current focus areas: ${item.focus_area_ids}`);
    const isPolicies = table === 'policies';
    if(isPolicies) parts.push('IMPORTANT: Write the title_6th_grade and summary_6th_grade so a 6th-grader can understand. For impact_statement, write 2-3 sentences in asset-based language explaining how this policy connects to your/your family\'s daily life. Focus on opportunities, protections, or resources it provides. Use "you" and "your family".');
    const content=parts.join('\n')+`\nReturn: {"theme_primary":"THEME_XX","theme_secondary":[],"focus_area_ids":["FA_XXX"],"center":"","resource_type_id":"RTYPE_XX","audience_segment_ids":[],"life_situation_ids":[],"service_cat_ids":[],"title_6th_grade":"","summary_6th_grade":"",${isPolicies?'"impact_statement":"",':''}"geographic_scope":"Houston","confidence":0.0,"reasoning":"brief"}`;
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:isPolicies?1000:800,system:sysPrompt,messages:[{role:'user',content}]})});
    if(!r.ok){const e=await r.text();throw new Error(`API ${r.status}: ${e.substring(0,200)}`);}
    const d=await r.json();let txt=(d.content?.[0]?.text||'').trim();
    if(txt.startsWith('```json'))txt=txt.slice(7);if(txt.startsWith('```'))txt=txt.slice(3);if(txt.endsWith('```'))txt=txt.slice(0,-3);txt=txt.trim();
    const s=txt.indexOf('{'),e=txt.lastIndexOf('}');if(s===-1||e===-1)throw new Error('No JSON');
    const raw=JSON.parse(txt.substring(s,e+1));
    const efa:any[]=[];
    for(const fid of(raw.focus_area_ids||[])){const f=faLookup.get(fid);if(f){efa.push({id:f.focus_id,name:f.focus_area_name,theme:f.theme_id});}}
    const enriched={...raw,_enriched_focus_areas:efa,_version:'v2-full-matrix'};
    const patchBody:any={classification_v2:enriched,focus_area_ids:(enriched.focus_area_ids||[]).join(',')};
    if(enriched.title_6th_grade)patchBody.title_6th_grade=enriched.title_6th_grade;
    if(enriched.summary_6th_grade)patchBody.summary_6th_grade=enriched.summary_6th_grade;
    if(isPolicies&&enriched.impact_statement)patchBody.impact_statement=enriched.impact_statement;
    await patch(table,`${cfg.pk}=eq.${id}`,patchBody);
    results.push({id,name,status:'done',confidence:enriched.confidence});
  }catch(err){results.push({id,name,status:'error',error:(err as Error).message});}
}
const tot=await db(`${table}?select=${cfg.pk}&limit=1000`);const dn=await db(`${table}?select=${cfg.pk}&classification_v2=not.is.null&limit=1000`);
return new Response(JSON.stringify({success:true,table,classified:results.filter(r=>r.status==='done').length,errors:results.filter(r=>r.status==='error').length,progress:{done:dn?.length||0,total:tot?.length||0,remaining:(tot?.length||0)-(dn?.length||0),percent:Math.round(((dn?.length||0)/(tot?.length||0))*100)},results}),{headers:{...CORS,'Content-Type':'application/json'}});
}catch(err){return new Response(JSON.stringify({error:(err as Error).message}),{status:500,headers:{...CORS,'Content-Type':'application/json'}});}
});
