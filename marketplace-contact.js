const TCS_API_BASE=window.TCS_API_BASE;function apiUrl(path){
  const value=String(path||'').trim();
  if(!value)return '';
  const repaired=value.replace(/^https\/\//i,'https://').replace(/^http\/\//i,'http://');
  if(/^https?:\/\//i.test(repaired)||repaired.startsWith('data:')||repaired.startsWith('blob:'))return repaired;
  return TCS_API_BASE+(repaired.startsWith('/')?'':'/')+repaired;
}
async function send(e){e.preventDefault();const slug=new URLSearchParams(location.search).get('listing');const out=document.getElementById('contactResult');try{const body=Object.fromEntries(new FormData(e.target));const r=await fetch(apiUrl('/api/marketplace-live/public/contact/'+encodeURIComponent(slug)+'/email'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const x=await r.json();if(!r.ok)throw Error(x.error||'Message failed');out.innerHTML='<div class="notice"><b>Message sent.</b> Reference: '+x.reference+'</div>';e.target.reset()}catch(err){out.innerHTML='<div class="notice">'+err.message+'</div>'}}addEventListener('DOMContentLoaded',()=>document.getElementById('contactForm').addEventListener('submit',send));