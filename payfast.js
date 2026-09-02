const crypto=require('crypto');const config=require('../config');
function cleanParams(params){const out={};Object.keys(params||{}).sort().forEach(k=>{if(k==='signature')return;const v=params[k];if(v!==undefined&&v!==null&&String(v)!=='')out[k]=String(v).trim()});return out}
function queryString(params,withPassphrase=true){const cleaned=cleanParams(params);let q=Object.keys(cleaned).map(k=>`${encodeURIComponent(k)}=${encodeURIComponent(cleaned[k]).replace(/%20/g,'+')}`).join('&');if(withPassphrase&&config.payfast.passphrase)q+=`&passphrase=${encodeURIComponent(config.payfast.passphrase).replace(/%20/g,'+')}`;return q}
function signature(params){return crypto.createHash('md5').update(queryString(params,true)).digest('hex')}
function validateSignature(params){if(!params.signature)return{ok:false,reason:'Missing signature'};const expected=signature(params);return{ok:expected===String(params.signature).toLowerCase(),expected,received:params.signature}}
function validateMerchant(params){if(String(params.merchant_id||'')!==String(config.payfast.merchantId))return{ok:false,reason:'Invalid merchant_id'};return{ok:true}}
function validateAmount(params,expected){const amount=Number(params.amount_gross||params.amount||0);return Math.abs(amount-Number(expected||0))<0.01?{ok:true,amount}:{ok:false,reason:'Amount mismatch',amount,expected}}
function validatePaymentStatus(params){return String(params.payment_status||'').toUpperCase()==='COMPLETE'?{ok:true}:{ok:false,reason:'Payment not COMPLETE',status:params.payment_status}}
function validateITN(params,expectedAmount){const checks=[validateMerchant(params),validateSignature(params),validateAmount(params,expectedAmount),validatePaymentStatus(params)];return{ok:checks.every(c=>c.ok),checks}}
module.exports={signature,validateSignature,validateMerchant,validateAmount,validatePaymentStatus,validateITN,queryString};
