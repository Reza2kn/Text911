const common = {'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'geolocation=(self), microphone=(), camera=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://huggingface.co https://*.hf.space"};
export default {
 async fetch(request) {
  const url=new URL(request.url);
  if(url.pathname==='/api/location') {
   if(request.method!=='POST')return Response.json({error:'Use POST.'},{status:405,headers:{...common,'Allow':'POST'}});
   try {
    if(Number(request.headers.get('content-length'))>1024)return Response.json({error:'Request too large.'},{status:413,headers:common});
    const {latitude,longitude}=await request.json();
    if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude< -90||latitude>90||longitude< -180||longitude>180)return Response.json({error:'Invalid coordinates.'},{status:400,headers:common});
    const census=new URL('https://geocoding.geo.census.gov/geocoder/geographies/coordinates');
    census.search=new URLSearchParams({x:String(longitude),y:String(latitude),benchmark:'Public_AR_Current',vintage:'Current_Current',format:'json'});
    const response=await fetch(census,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('Census county lookup unavailable');
    const body=await response.json();const geographies=body.result?.geographies;
    if(!geographies||typeof geographies!=='object')throw Error('Unexpected Census response');
    const counties=geographies.Counties||[];if(!Array.isArray(counties))throw Error('Unexpected county response');
    return Response.json({counties:counties.map(c=>({id:c.GEOID,name:c.NAME}))},{headers:{...common,'Cache-Control':'no-store'}});
   }catch{return Response.json({error:'County lookup is temporarily unavailable. Search by county or ZIP instead.'},{status:503,headers:{...common,'Cache-Control':'no-store'}});}
  }
  if(url.pathname==='/api/address') {
   if(request.method!=='POST')return Response.json({error:'Use POST.'},{status:405,headers:{...common,'Allow':'POST'}});
   try {
    if(Number(request.headers.get('content-length'))>2048)return Response.json({error:'Address too long.'},{status:413,headers:common});
    const payload=await request.json();const address=payload.address;
    if(typeof address!=='string'||address.length<5||address.length>250)return Response.json({error:'Enter a complete U.S. street address, city and state.'},{status:400,headers:common});
    const census=new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
    census.search=new URLSearchParams({address,benchmark:'Public_AR_Current',vintage:'Current_Current',format:'json'});
    const response=await fetch(census,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('Census geocoder unavailable');
    const body=await response.json();const matches=body.result?.addressMatches;
    if(!Array.isArray(matches))throw Error('Unexpected geocoder response');
    const candidates=matches.slice(0,5).map(m=>({address:m.matchedAddress,counties:(m.geographies?.Counties||[]).map(c=>({id:c.GEOID,name:c.NAME})),coordinates:m.coordinates}));
    return Response.json({candidates},{headers:{...common,'Cache-Control':'no-store'}});
   } catch {
    return Response.json({error:'Address lookup is temporarily unavailable. Search by county or ZIP instead.'},{status:503,headers:{...common,'Cache-Control':'no-store'}});
   }
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:common});
  const path=url.pathname==='/'?'/index.html':url.pathname;
  const content=ASSETS[path];if(content===undefined)return new Response('Not found',{status:404,headers:common});
  const type=path.endsWith('.html')?'text/html; charset=utf-8':path.endsWith('.css')?'text/css; charset=utf-8':path.endsWith('.js')?'text/javascript; charset=utf-8':path.endsWith('.json')?'application/json; charset=utf-8':'text/plain; charset=utf-8';
  return new Response(request.method==='HEAD'?null:content,{headers:{...common,'Content-Type':type,'Cache-Control':'public, max-age=0, must-revalidate'}});
 }
};
