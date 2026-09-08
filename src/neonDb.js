const {Pool}=require('pg');

if(!process.env.DATABASE_URL){
  console.warn('DATABASE_URL is not configured. Neon database routes will return a clear error.');
}

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:{rejectUnauthorized:false},
  max:Number(process.env.PG_POOL_MAX||10),
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:15000
});

function mapListing(r){
  if(!r)return null;
  return {
    id:r.id,sellerId:r.seller_id,listingKind:r.listing_kind,category:r.category,
    title:r.title,slug:r.slug,price:Number(r.price||0),priceType:r.price_type,
    make:r.make||'',model:r.model||'',year:r.year||'',usage:r.usage||'',
    condition:r.condition||'',province:r.province||'',town:r.town||'',
    description:r.description||'',phone:r.phone||'',whatsapp:r.whatsapp||'',
    images:Array.isArray(r.images)?r.images:[],coverImage:r.cover_image||'',
    status:r.status,approvalStatus:r.approval_status,approvedAt:r.approved_at||'',
    approvedBy:r.approved_by||'',rejectReason:r.reject_reason||'',
    createdAt:r.created_at,updatedAt:r.updated_at||'',updatedBy:r.updated_by||''
  };
}

async function query(text,params=[]){return pool.query(text,params)}
async function health(){const r=await query('select now() as now, current_database() as database');return r.rows[0]}
module.exports={pool,query,health,mapListing};
