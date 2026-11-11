exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return {statusCode:405,body:'Method not allowed'};
 const id=String((event.queryStringParameters||{}).id||'');
 if(!/^\d{1,10}$/.test(id))return {statusCode:400,body:'Invalid route ID'};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch('https://www.mybustimes.cc/api/routes/'+id+'/stops/',{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Upstream '+response.status);
  const data=await response.json();
  return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=90,s-maxage=120'},body:JSON.stringify(data)};
 }catch(e){return {statusCode:502,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Stop information temporarily unavailable'})}}
 finally{clearTimeout(timeout)}
};
