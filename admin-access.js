/* Build32 static admin access gate. Test-stage only; production requires server authentication. */
const TCS_ADMIN_SESSION_KEY='tcs_marketplace_admin_email_v1';
const TCS_ADMIN_ALLOWLIST=[
  'rudolphvanwyk@rocketmail.com',
  'theosteynplant@gmail.com',
  'janplessis@yahoo.co.uk'
];
function normalEmail(v){return String(v||'').trim().toLowerCase()}
function currentAdmin(){const e=normalEmail(sessionStorage.getItem(TCS_ADMIN_SESSION_KEY));return TCS_ADMIN_ALLOWLIST.includes(e)?e:''}
function adminLogin(email){const e=normalEmail(email);if(!TCS_ADMIN_ALLOWLIST.includes(e))return false;sessionStorage.setItem(TCS_ADMIN_SESSION_KEY,e);return true}
function adminLogout(){sessionStorage.removeItem(TCS_ADMIN_SESSION_KEY);location.href='admin-login.html'}
function protectAdminPage(){if(!currentAdmin()){const next=encodeURIComponent(location.pathname.split('/').pop()||'admin-dashboard.html');location.replace('admin-login.html?next='+next);return false}document.documentElement.classList.add('admin-authorized');return true}
function renderAdminIdentity(){const el=document.getElementById('adminIdentity');if(el)el.textContent=currentAdmin()}
