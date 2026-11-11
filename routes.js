const URL_SOURCE='https://www.mybustimes.cc/api/group/Local%20Links/routes/?stops_have_cords=true';
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return {statusCode:405,body:'Method not allowed'};
 try{
  let url=URL_SOURCE,results=[];
  for(let page=0;page<12&&url;page++){
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
   let response;try{response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}})}finally{clearTimeout(timeout)}
   if(!response.ok)throw Error('Upstream '+response.status);
   const data=await response.json();
   if(Array.isArray(data)){results.push(...data);break}
   results.push(...(Array.isArray(data.results)?data.results:[]));
   if(!data.next)break;
   const next=new URL(data.next,URL_SOURCE);
   if(next.hostname!=='www.mybustimes.cc'||!next.pathname.startsWith('/api/group/Local%20Links/routes/'))break;
   url=next.toString();
  }
  return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=120,s-maxage=180'},body:JSON.stringify({results})};
 }catch(e){return {statusCode:502,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Routes temporarily unavailable'})}}
};
