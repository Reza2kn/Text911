import http from 'node:http';
import fs from 'node:fs/promises';
import worker from '../dist/server/index.js';
const server=http.createServer(async (req,res)=>{
 try{
  const buffers=[];for await(const chunk of req)buffers.push(chunk);const body=Buffer.concat(buffers);
  const url=new URL(`http://localhost:4173${req.url}`);
  if(url.pathname==='/qa/save'&&req.method==='POST'){const value=JSON.parse(body);await fs.writeFile(`reports/axe-${value.width}-${value.state}.json`,JSON.stringify(value,null,2));res.writeHead(200);res.end('Saved');return;}
  if(url.pathname.startsWith('/qa/')){const file={'/qa/axe.js':'node_modules/axe-core/axe.min.js','/qa/run.js':'scripts/qa-browser.js','/qa/fixture.js':'scripts/qa-fixture.js'}[url.pathname];if(file){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await fs.readFile(file));return;}}
  const request=new Request(url,{method:req.method,headers:req.headers,...(body.length?{body,duplex:'half'}:{})});const result=await worker.fetch(request);let text=Buffer.from(await result.arrayBuffer());
  if(url.pathname==='/'&&url.searchParams.has('qa'))text=Buffer.from(text.toString().replace('</head>','<script src="/qa/fixture.js"></script><script defer src="/qa/run.js"></script></head>'));
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(text);
 }catch(error){res.writeHead(500);res.end('Server error');console.error(error.message);}
});server.listen(4173,'127.0.0.1',()=>console.log('Local: http://localhost:4173'));
