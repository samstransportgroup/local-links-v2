// Read-only proxy for the public MyBusTimes Local Links simulated-vehicle endpoint.
// No secrets or cookies are forwarded. Serverless function required (Netlify Git/CLI deployment).
const SOURCE = 'https://www.mybustimes.cc/api/group/Local%20Links/vehicles/';
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return {statusCode:405,body:'Method not allowed'};
  const input = event.queryStringParameters || {};
  const limits = {xmin:[-9,3],xmax:[-9,3],ymin:[49,60],ymax:[49,60],limit:[1,5000]};
  const q = new URLSearchParams();
  for(const [key,[min,max]] of Object.entries(limits)) {
    const value = Number(input[key]);
    if(!Number.isFinite(value)||value<min||value>max) return {statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Invalid '+key})};
    q.set(key,String(value));
  }
  if(Number(input.xmin)>=Number(input.xmax)||Number(input.ymin)>=Number(input.ymax)) return {statusCode:400,body:'Invalid bounds'};
  try {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
    let response;
    try {response=await fetch(SOURCE+'?'+q,{headers:{Accept:'application/json','User-Agent':'LocalLinksWebsite/2.0 (simulated transport community)'},signal:controller.signal});}
    finally {clearTimeout(timeout)}
    if(!response.ok) return {statusCode:502,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'MyBusTimes returned '+response.status})};
    const data=await response.json();
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=15, s-maxage=20'},body:JSON.stringify(data)};
  } catch(e) {return {statusCode:502,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'MyBusTimes tracking could not be reached'})};}
};
