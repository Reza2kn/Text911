(async()=>{
 if(new URLSearchParams(location.search).get('qa')!=='audit')return;
 while(document.getElementById('search-button').disabled)await new Promise(r=>setTimeout(r,100));
 const s=document.createElement('script');s.src='/qa/axe.js';document.head.append(s);await new Promise((resolve,reject)=>{s.onload=resolve;s.onerror=reject;});
 let busy=false;
 async function scan(){
  if(busy)return;busy=true;
  try{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
  const state=document.querySelector('dialog[open]')?.id||(!document.getElementById('result').hidden?'county-result':'home');
  const summary={url:location.pathname,state,width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,timestamp:new Date().toISOString(),violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:result.passes.length};
  let output=document.getElementById('qa-result');if(!output){output=document.createElement('pre');output.id='qa-result';output.hidden=true;document.body.append(output);}output.textContent=JSON.stringify(summary,null,2);
  await fetch('/qa/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(summary)});
  }finally{busy=false;}
 }
 document.addEventListener('click',()=>setTimeout(scan,400));document.addEventListener('change',()=>setTimeout(scan,400));await scan();
})();
