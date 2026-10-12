import fs from 'node:fs/promises';
import {geoAlbersUsa,geoMercator,geoPath,geoArea} from 'd3-geo';
import {build} from 'esbuild';
import {marked} from 'marked';
const registry=JSON.parse(await fs.readFile('data/registry.json','utf8'));
const geography=JSON.parse(await fs.readFile('data/source/counties.geojson','utf8'));
const states=JSON.parse(await fs.readFile('data/states.json','utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const features=geography.features.map(f=>structuredClone(f));
for(const f of features) if(geoArea(f)>2*Math.PI) {
 const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const p of polys) for(const ring of p) ring.reverse();
}
const counties=new Map(registry.counties.map(c=>[c.id,c]));
const projection=geoAlbersUsa().scale(1180).translate([490,310]);
const path=geoPath(projection).digits(1);
let svg='<svg id="county-map" viewBox="0 0 1000 640" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="unknown-pattern" patternUnits="userSpaceOnUse" width="5" height="5"><rect width="5" height="5" fill="#dfdfd6"/><path d="M0 5L5 0" stroke="#979b90" stroke-width=".6"/></pattern></defs><g id="map-counties">';
for(const f of features){const c=counties.get(f.properties.GEOID);if(!c)continue;const d=path(f);if(d) svg+=`<path class="county ${c.status}" data-id="${c.id}" d="${d}"><title>${escape(c.name)}, ${c.state}: ${c.status}</title></path>`;}
// Puerto Rico and Virgin Islands inset. Pacific territories remain available in the equivalent county list.
const caribbean=features.filter(f=>['72','78'].includes(f.properties.STATE));
const cp=geoMercator().fitExtent([[760,510],[955,585]],{type:'FeatureCollection',features:caribbean});const carPath=geoPath(cp).digits(1);
for(const f of caribbean){const c=counties.get(f.properties.GEOID);svg+=`<path class="county ${c.status}" data-id="${c.id}" d="${carPath(f)}"><title>${escape(c.name)}, ${c.state}: ${c.status}</title></path>`;}
svg+='</g><g class="map-labels" fill="#5f716d" font-family="system-ui" font-size="12" letter-spacing="1"><text x="140" y="581">ALASKA</text><text x="350" y="592">HAWAII</text><text x="780" y="612">PUERTO RICO / U.S. VI</text><text x="45" y="270" transform="rotate(-70 45 270)">PACIFIC OCEAN</text><text x="885" y="355" transform="rotate(-62 885 355)">ATLANTIC OCEAN</text></g></svg>';
await fs.mkdir('dist/data',{recursive:true});
await build({entryPoints:['src/geo-entry.js'],bundle:true,minify:true,format:'esm',outfile:'dist/geo.js'});
let html=await fs.readFile('src/index.html','utf8'); html=html.replace('<!-- MAP -->',svg);
await fs.writeFile('dist/index.html',html);
await fs.copyFile('src/style.css','dist/style.css');await fs.copyFile('src/app.js','dist/app.js');await fs.copyFile('src/logic.js','dist/logic.js');
await fs.copyFile('data/registry.json','dist/data/registry.json');
const lines=(await fs.readFile('data/source/zip-counties.txt','utf8')).trim().split(/\r?\n/), headers=lines.shift().split('|');
const zi=headers.indexOf('GEOID_ZCTA5_20'),ci=headers.indexOf('GEOID_COUNTY_20');if(zi<0||ci<0)throw Error('ZIP relationship schema changed');
const zips={};for(const line of lines){const cols=line.split('|');if(!cols[zi]||!cols[ci])continue;(zips[cols[zi]]??=new Set()).add(cols[ci]);}
await fs.writeFile('dist/data/zips.json',JSON.stringify(Object.fromEntries(Object.entries(zips).map(([k,v])=>[k,[...v]]))));
await fs.mkdir('dist/reports',{recursive:true});
for(const name of await fs.readdir('reports')) if(!name.endsWith('.png')){await fs.copyFile(`reports/${name}`,`dist/reports/${name}`);if(name.endsWith('.md')){const md=await fs.readFile(`reports/${name}`,'utf8');const title=md.split('\n')[0].replace(/^# /,'');const body=marked.parse(md).replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');await fs.writeFile(`dist/reports/${name.replace(/\.md$/,'.html')}`,`<!doctype html><html lang="en" class="report-page"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Text911</title><link rel="stylesheet" href="/style.css"></head><body class="report"><main><a href="/">← Back to Text911</a><article>${body}</article></main></body></html>`);}}
let manifest=null;try{manifest=JSON.parse(await fs.readFile('.openai/hosting.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(manifest){delete manifest.static;await fs.writeFile('.openai/hosting.json',JSON.stringify(manifest,null,2)+'\n');}
const assets={};for(const name of ['index.html','style.css','app.js','logic.js','geo.js','data/registry.json','data/zips.json',...((await fs.readdir('dist/reports')).map(n=>'reports/'+n))]){assets['/'+name]=await fs.readFile('dist/'+name,'utf8');}
const runtime=await fs.readFile('worker/runtime.js','utf8');await fs.mkdir('dist/server',{recursive:true});if(manifest)await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+runtime);if(manifest)await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log(`Built ${registry.counties.length} counties, ${registry.records.length} source records, ${Object.keys(zips).length} ZIP areas. SVG ${(Buffer.byteLength(svg)/1024).toFixed(0)} KB. No map tiles or runtime framework.`);
