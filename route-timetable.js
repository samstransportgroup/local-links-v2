// Reads the public fictional MyBusTimes service timetable, including rows hidden by "Timing Points".
const ROOT='https://www.mybustimes.cc';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public,max-age=90,s-maxage=180'};
function decode(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|nbsp|lt|gt|quot|#39|#x27);/g,x=>({'&amp;':'&','&nbsp;':' ','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#x27;':"'"}[x]||x)).replace(/\s+/g,' ').trim()}
function rows(html){const output=[];const re=/<tr\b([^>]*\bclass=["'][^"']*\bstop-row\b[^"']*["'][^>]*)>([\s\S]*?)<\/tr>/gi;let m;while((m=re.exec(html))){const th=m[2].match(/<th\b[^>]*class=["'][^"']*\bstop-name\b[^"']*["'][^>]*>([\s\S]*?)<\/th>/i);if(!th)continue;const times=[];for(const td of m[2].matchAll(/<td\b[^>]*class=["'][^"']*\bstop-time\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi)){const t=decode(td[1]);times.push((t.match(/\b\d{1,2}:\d{2}\b/)||[])[0]||null)}output.push({name:decode(th[1]),timingPoint:!(/\bminor\b/i.test(m[1])),times})}return output}
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return {statusCode:405,body:'Method not allowed'};
 const p=event.queryStringParameters||{},id=String(p.id||''),slug=String(p.operator||'');
 if(!/^\d{1,10}$/.test(id)||!/^local-links-[a-z0-9-]{1,70}$/.test(slug))return {statusCode:400,headers,body:JSON.stringify({error:'Invalid route or operator'})};
 const date=String(p.date||'');if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return {statusCode:400,headers,body:JSON.stringify({error:'Invalid date'})};
 const url=ROOT+'/operator/'+slug+'/route/'+id+'/'+(date?'?date='+encodeURIComponent(date):'');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch(url,{signal:controller.signal,headers:{Accept:'text/html','User-Agent':'LocalLinksTimetable/1.0'}});if(!response.ok)throw Error('MyBusTimes returned '+response.status);const html=await response.text();
 const tables=[];for(const block of html.matchAll(/<table\b[^>]*class=["'][^"']*\bfleet\b[^"']*["'][^>]*>[\s\S]*?<\/table>/gi)){const stops=rows(block[0]);if(stops.length)tables.push({direction:tables.length===0?'Outbound':'Inbound',stops})}
 if(!tables.length)throw Error('No public timetable table found');
 const options=[...html.matchAll(/<option\b[^>]*value=["'](\d{4}-\d{2}-\d{2})["'][^>]*>/gi)].map(m=>m[1]);
 return {statusCode:200,headers,body:JSON.stringify({routeId:id,operator:slug,date:date||options[0]||null,availableDates:options,directions:tables,source:url,scheduledOnly:true})};
 }catch(e){return {statusCode:502,headers,body:JSON.stringify({error:'Timetable could not be retrieved from MyBusTimes',detail:e.message})}}finally{clearTimeout(timeout)}
};
