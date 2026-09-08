const TCS_ADMIN_TOKEN_KEY='tcs_marketplace_admin_token_v2';
function adminToken(){return sessionStorage.getItem(TCS_ADMIN_TOKEN_KEY)||''}
function setAdminToken(v){sessionStorage.setItem(TCS_ADMIN_TOKEN_KEY,v)}
function clearAdminToken(){sessionStorage.removeItem(TCS_ADMIN_TOKEN_KEY)}
async function adminApi(path,opt={}){const token=adminToken();const headers=new Headers(opt.headers||{});if(token)headers.set('Authorization','Bearer '+token);const r=await fetch(window.TCS_API_BASE+path,{...opt,headers});const text=await r.text();let x={};try{x=text?JSON.parse(text):{}}catch(e){x={error:'Invalid server response'}}if(r.status===401){clearAdminToken();if(!location.pathname.endsWith('admin-login.html'))location.replace('admin-login.html');throw Error('Admin session expired')}if(!r.ok)throw Error(x.error||'Request failed');return x}
async function currentAdmin(){if(!adminToken())return null;try{return await adminApi('/api/auth/session')}catch(e){return null}}
async function protectAdminPage(){const x=await currentAdmin();if(!x?.authenticated){location.replace('admin-login.html');return false}document.documentElement.classList.add('admin-authorized');window.TCS_CURRENT_ADMIN=x;renderAdminIdentity();return true}
async function adminLogout(){try{if(adminToken())await adminApi('/api/auth/logout',{method:'POST'})}catch(e){}clearAdminToken();location.href='admin-login.html'}
function renderAdminIdentity(){const el=document.getElementById('adminIdentity');if(el)el.textContent=window.TCS_CURRENT_ADMIN?.email||''}
