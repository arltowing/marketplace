const path=require('path');
const crypto=require('crypto');
const {S3Client,PutObjectCommand,DeleteObjectCommand,HeadBucketCommand}=require('@aws-sdk/client-s3');

const endpoint=String(process.env.AWS_ENDPOINT_URL_S3||process.env.NEON_STORAGE_ENDPOINT||'').replace(/\/$/,'');
const region=process.env.AWS_REGION||process.env.NEON_STORAGE_REGION||'us-east-2';
const accessKeyId=process.env.AWS_ACCESS_KEY_ID||process.env.NEON_STORAGE_ACCESS_KEY_ID||'';
const secretAccessKey=process.env.AWS_SECRET_ACCESS_KEY||process.env.NEON_STORAGE_SECRET_ACCESS_KEY||'';
const bucket=process.env.NEON_STORAGE_BUCKET||'marketplace-listing-images';
const configured=Boolean(endpoint&&accessKeyId&&secretAccessKey&&bucket);
const client=configured?new S3Client({region,endpoint,credentials:{accessKeyId,secretAccessKey},forcePathStyle:true}):null;
const mimeExt={'image/jpeg':'.jpg','image/jpg':'.jpg','image/png':'.png','image/webp':'.webp'};

function cleanName(v){return String(v||'image').replace(/[^a-zA-Z0-9._-]/g,'_')}
function objectKey(listingId,file,index){
  let ext=path.extname(cleanName(file.originalname)).toLowerCase();
  if(ext==='.jfif')ext='.jpg';
  if(!['.jpg','.jpeg','.png','.webp'].includes(ext))ext=mimeExt[file.mimetype]||'.jpg';
  return `listings/${listingId}/${Date.now()}-${index+1}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}
function publicUrl(key){return `${endpoint}/${encodeURIComponent(bucket)}/${String(key).split('/').map(encodeURIComponent).join('/')}`}
async function uploadImages(listingId,files=[]){
  if(!files.length)return [];
  if(!configured)throw new Error('Neon Object Storage is not configured on Render');
  const rows=[];
  for(let i=0;i<files.length;i++){
    const f=files[i],key=objectKey(listingId,f,i);
    await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:f.buffer,ContentType:f.mimetype||'image/jpeg',CacheControl:'public, max-age=31536000, immutable'}));
    rows.push({key,url:publicUrl(key)});
  }
  return rows;
}
async function deleteImages(images=[]){
  if(!configured)return;
  for(const item of images){
    const key=typeof item==='string'?null:item&&item.key;
    if(key)await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));
  }
}
async function health(){
  if(!configured)return {configured:false,bucket};
  await client.send(new HeadBucketCommand({Bucket:bucket}));
  return {configured:true,bucket,endpoint};
}
module.exports={uploadImages,deleteImages,health,configured,bucket};
