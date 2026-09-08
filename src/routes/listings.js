const express=require('express');
const multer=require('multer');
const {requireRole}=require('../auth');
const db=require('../neonDb');
const storage=require('../neonStorage');
const r=express.Router();
const allowed=new Set(['image/jpeg','image/jpg','image/png','image/webp']);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:12},fileFilter:(req,file,cb)=>cb(null,allowed.has(file.mimetype)||String(file.originalname).toLowerCase().endsWith('.jfif'))});
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
function slugify(v){return clean(v,100).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now()}
function id(prefix){return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function imageUrls(images){return (images||[]).map(x=>typeof x==='string'?x:x.url).filter(Boolean)}
function publicListing(x){const y=db.mapListing(x);y.images=imageUrls(y.images);y.coverImage=y.images[0]||'';return y}
function asyncRoute(fn){return(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}

r.get('/public',asyncRoute(async(req,res)=>{
  const values=[],where=["status='active'","approval_status='approved'"];
  const q=clean(req.query.q,100),cat=clean(req.query.category,80),province=clean(req.query.province,80);
  if(q){values.push('%'+q.toLowerCase()+'%');where.push(`lower(concat_ws(' ',title,description,category,town,make,model)) like $${values.length}`)}
  if(cat){values.push(cat);where.push(`category=$${values.length}`)}
  if(province){values.push(province);where.push(`province=$${values.length}`)}
  const result=await db.query(`select * from marketplace_listings where ${where.join(' and ')} order by created_at desc`,values);
  res.json(result.rows.map(publicListing));
}));

r.get('/public/:slug',asyncRoute(async(req,res)=>{
  const result=await db.query("select * from marketplace_listings where slug=$1 and status='active' and approval_status='approved' limit 1",[req.params.slug]);
  if(!result.rows[0])return res.status(404).json({error:'Listing not found'});
  res.json(publicListing(result.rows[0]));
}));

r.post('/create',upload.array('images',12),asyncRoute(async(req,res)=>{
  const title=clean(req.body.title,120),category=clean(req.body.category,80),description=clean(req.body.description,3000);
  if(!title||!category||!description)return res.status(400).json({error:'Title, category and description are required'});
  const listingId=id('listing'),slug=slugify(title);
  let stored=[];
  try{
    stored=await storage.uploadImages(listingId,req.files||[]);
    const values=[listingId,clean(req.body.sellerEmail||req.body.phone||req.body.whatsapp||'public-seller',160),clean(req.body.listingKind||'item',30),category,title,slug,Number(req.body.price||0),clean(req.body.priceType||'Fixed',30),clean(req.body.make,60),clean(req.body.model,60),clean(req.body.year,10),clean(req.body.usage,40),clean(req.body.condition,40),clean(req.body.province,60),clean(req.body.town,80),description,clean(req.body.phone,30),clean(req.body.whatsapp,30).replace(/\D/g,''),JSON.stringify(stored),stored[0]?.url||''];
    const result=await db.query(`insert into marketplace_listings (id,seller_id,listing_kind,category,title,slug,price,price_type,make,model,year,usage,condition,province,town,description,phone,whatsapp,images,cover_image,status,approval_status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,'draft','pending') returning *`,values);
    await db.query("insert into marketplace_events(event_type,message,metadata) values('seller.listing_submitted','Physical listing submitted',$1::jsonb)",[JSON.stringify({listingId})]);
    res.json({ok:true,listing:publicListing(result.rows[0]),storage:'neon'});
  }catch(e){
    if(stored.length)await storage.deleteImages(stored).catch(()=>{});
    throw e;
  }
}));

r.get('/admin/pending',requireRole('admin'),asyncRoute(async(req,res)=>{const x=await db.query("select * from marketplace_listings where approval_status='pending' order by created_at desc");res.json(x.rows.map(publicListing))}));
r.get('/admin/all',requireRole('admin'),asyncRoute(async(req,res)=>{const x=await db.query('select * from marketplace_listings order by created_at desc');res.json(x.rows.map(publicListing))}));
r.post('/admin/:id/approve',requireRole('admin'),asyncRoute(async(req,res)=>{const x=await db.query("update marketplace_listings set status='active',approval_status='approved',approved_at=now(),approved_by=$2,updated_at=now() where id=$1 returning *",[req.params.id,req.currentUser.id]);if(!x.rows[0])return res.status(404).json({error:'Listing not found'});res.json({ok:true,listing:publicListing(x.rows[0])})}));
r.post('/admin/:id/reject',requireRole('admin'),asyncRoute(async(req,res)=>{const x=await db.query("update marketplace_listings set status='rejected',approval_status='rejected',reject_reason=$2,updated_at=now() where id=$1 returning *",[req.params.id,clean(req.body.reason||'Rejected',300)]);if(!x.rows[0])return res.status(404).json({error:'Listing not found'});res.json({ok:true,listing:publicListing(x.rows[0])})}));
r.patch('/admin/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
  const current=await db.query('select * from marketplace_listings where id=$1',[req.params.id]);if(!current.rows[0])return res.status(404).json({error:'Listing not found'});
  const c=current.rows[0],price=req.body.price===undefined?c.price:Number(req.body.price);if(!Number.isFinite(Number(price))||Number(price)<0)return res.status(400).json({error:'Invalid price'});
  const v=[req.params.id,clean(req.body.title??c.title,120),Number(price),clean(req.body.priceType??c.price_type,30),clean(req.body.description??c.description,3000),clean(req.body.town??c.town,80),clean(req.body.province??c.province,60),req.currentUser.id];
  const x=await db.query('update marketplace_listings set title=$2,price=$3,price_type=$4,description=$5,town=$6,province=$7,updated_by=$8,updated_at=now() where id=$1 returning *',v);res.json({ok:true,listing:publicListing(x.rows[0])});
}));
r.delete('/admin/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
  const x=await db.query('select * from marketplace_listings where id=$1',[req.params.id]);if(!x.rows[0])return res.status(404).json({error:'Listing not found'});
  const images=Array.isArray(x.rows[0].images)?x.rows[0].images:[];
  await storage.deleteImages(images);
  await db.query('delete from marketplace_listings where id=$1',[req.params.id]);
  res.json({ok:true,deletedId:req.params.id,deletedImages:images.length});
}));
r.post('/public/:id/report',asyncRoute(async(req,res)=>{const reportId=id('report');await db.query('insert into marketplace_reports(id,listing_id,reason,status) values($1,$2,$3,\'open\')',[reportId,req.params.id,clean(req.body.reason,500)]);res.json({ok:true,reference:reportId})}));
module.exports=r;
