import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const app = new Hono();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bucket = process.env.NEON_STORAGE_BUCKET || 'marketplace-listing-images';
const endpoint = String(process.env.AWS_ENDPOINT_URL_S3 || '').replace(/\/$/, '');
const region = process.env.AWS_REGION || 'us-east-2';
const storageReady = Boolean(endpoint && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const s3 = storageReady ? new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
}) : null;

app.use('*', cors({
  origin: (origin) => ['https://marketplace.tcstowing.co.za', 'https://www.marketplace.tcstowing.co.za', 'http://localhost:3000'].includes(origin) ? origin : 'https://marketplace.tcstowing.co.za',
  allowHeaders: ['Content-Type', 'X-Demo-User'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}));

const clean = (v: unknown, n = 500) => String(v ?? '').trim().slice(0, n);
const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const slugify = (v: unknown) => `${clean(v, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
const isAdmin = (c: any) => c.req.header('x-demo-user') === 'u_admin_1';
const requireAdmin = (c: any) => isAdmin(c) ? null : c.json({ error: 'Unauthorized' }, 401);
const imageObjects = (v: any) => Array.isArray(v) ? v : [];
const imageUrls = (v: any) => imageObjects(v).map((x: any) => typeof x === 'string' ? x : x?.url).filter(Boolean);

function publicUrl(key: string) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;
}

function mapListing(r: any) {
  const images = imageUrls(r.images);
  return {
    id: r.id, sellerId: r.seller_id, listingKind: r.listing_kind, category: r.category,
    title: r.title, slug: r.slug, price: Number(r.price || 0), priceType: r.price_type,
    make: r.make || '', model: r.model || '', year: r.year || '', usage: r.usage || '',
    condition: r.condition || '', province: r.province || '', town: r.town || '',
    description: r.description || '', phone: r.phone || '', whatsapp: r.whatsapp || '',
    images, coverImage: images[0] || r.cover_image || '', status: r.status,
    approvalStatus: r.approval_status, approvedAt: r.approved_at || '', approvedBy: r.approved_by || '',
    rejectReason: r.reject_reason || '', createdAt: r.created_at, updatedAt: r.updated_at || '', updatedBy: r.updated_by || '',
  };
}

async function uploadFiles(listingId: string, files: File[]) {
  if (!files.length) return [];
  if (!s3) throw new Error('Neon Object Storage credentials are not available to the Function');
  const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  const uploaded: Array<{key:string,url:string}> = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.size > 10 * 1024 * 1024) throw new Error(`${f.name} exceeds the 10 MB image limit`);
    if (!allowed.has(f.type) && !f.name.toLowerCase().endsWith('.jfif')) throw new Error(`${f.name} is not a supported image`);
    let ext = f.name.toLowerCase().split('.').pop() || 'jpg';
    if (ext === 'jfif' || ext === 'jpeg') ext = 'jpg';
    if (!['jpg', 'png', 'webp'].includes(ext)) ext = 'jpg';
    const key = `listings/${listingId}/${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: new Uint8Array(await f.arrayBuffer()), ContentType: f.type || 'image/jpeg', CacheControl: 'public, max-age=31536000, immutable' }));
    uploaded.push({ key, url: publicUrl(key) });
  }
  return uploaded;
}

async function deleteImages(images: any[]) {
  if (!s3) throw new Error('Neon Object Storage credentials are not available to the Function');
  for (const image of images) {
    const key = typeof image === 'object' ? image?.key : '';
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}

app.get('/', (c) => c.json({ ok: true, service: 'tcs-marketplace', build: '47-neon-native' }));
app.get('/api/health', async (c) => {
  try {
    const db = await pool.query('select current_database() as database');
    let storage: any = { configured: storageReady, bucket };
    if (s3) {
      try { await s3.send(new HeadBucketCommand({ Bucket: bucket })); storage.ok = true; }
      catch (e: any) { storage.ok = false; storage.error = e.message; }
    }
    return c.json({ ok: true, service: 'tcs-marketplace', build: '47-neon-native', database: { ok: true, name: db.rows[0].database }, storage });
  } catch (e: any) {
    return c.json({ ok: false, service: 'tcs-marketplace', build: '47-neon-native', error: e.message }, 503);
  }
});

app.get('/api/listings/public', async (c) => {
  const q = clean(c.req.query('q'), 100).toLowerCase();
  const category = clean(c.req.query('category'), 80);
  const province = clean(c.req.query('province'), 80);
  const values: any[] = [];
  const where = ["status='active'", "approval_status='approved'"];
  if (q) { values.push(`%${q}%`); where.push(`lower(concat_ws(' ',title,description,category,town,make,model)) like $${values.length}`); }
  if (category) { values.push(category); where.push(`category=$${values.length}`); }
  if (province) { values.push(province); where.push(`province=$${values.length}`); }
  const r = await pool.query(`select * from marketplace_listings where ${where.join(' and ')} order by created_at desc`, values);
  return c.json(r.rows.map(mapListing));
});

app.get('/api/listings/public/:slug', async (c) => {
  const r = await pool.query("select * from marketplace_listings where slug=$1 and status='active' and approval_status='approved' limit 1", [c.req.param('slug')]);
  return r.rows[0] ? c.json(mapListing(r.rows[0])) : c.json({ error: 'Listing not found' }, 404);
});

app.post('/api/listings/create', async (c) => {
  const form = await c.req.formData();
  const title = clean(form.get('title'), 120), category = clean(form.get('category'), 80), description = clean(form.get('description'), 3000);
  if (!title || !category || !description) return c.json({ error: 'Title, category and description are required' }, 400);
  const listingId = newId('listing');
  const files = form.getAll('images').filter((v): v is File => v instanceof File).slice(0, 12);
  let stored: any[] = [];
  try {
    stored = await uploadFiles(listingId, files);
    const values = [listingId, clean(form.get('sellerEmail') || form.get('phone') || form.get('whatsapp') || 'public-seller', 160), clean(form.get('listingKind') || 'item', 30), category, title, slugify(title), Number(form.get('price') || 0), clean(form.get('priceType') || 'Fixed', 30), clean(form.get('make'), 60), clean(form.get('model'), 60), clean(form.get('year'), 10), clean(form.get('usage'), 40), clean(form.get('condition'), 40), clean(form.get('province'), 60), clean(form.get('town'), 80), description, clean(form.get('phone'), 30), clean(form.get('whatsapp'), 30).replace(/\D/g, ''), JSON.stringify(stored), stored[0]?.url || ''];
    const r = await pool.query(`insert into marketplace_listings (id,seller_id,listing_kind,category,title,slug,price,price_type,make,model,year,usage,condition,province,town,description,phone,whatsapp,images,cover_image,status,approval_status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,'draft','pending') returning *`, values);
    await pool.query("insert into marketplace_events(event_type,message,metadata) values('seller.listing_submitted','Advert submitted',$1::jsonb)", [JSON.stringify({ listingId })]);
    return c.json({ ok: true, listing: mapListing(r.rows[0]), storage: 'neon' });
  } catch (e: any) {
    if (stored.length) await deleteImages(stored).catch(() => {});
    return c.json({ error: e.message }, 500);
  }
});

app.get('/api/listings/admin/pending', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query("select * from marketplace_listings where approval_status='pending' order by created_at desc");
  return c.json(r.rows.map(mapListing));
});
app.get('/api/listings/admin/all', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query('select * from marketplace_listings order by created_at desc');
  return c.json(r.rows.map(mapListing));
});
app.post('/api/listings/admin/:id/approve', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query("update marketplace_listings set status='active',approval_status='approved',approved_at=now(),approved_by='u_admin_1',updated_at=now() where id=$1 returning *", [c.req.param('id')]);
  return r.rows[0] ? c.json({ ok: true, listing: mapListing(r.rows[0]) }) : c.json({ error: 'Listing not found' }, 404);
});
app.post('/api/listings/admin/:id/reject', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const body = await c.req.json().catch(() => ({}));
  const r = await pool.query("update marketplace_listings set status='rejected',approval_status='rejected',reject_reason=$2,updated_at=now() where id=$1 returning *", [c.req.param('id'), clean(body.reason || 'Rejected', 300)]);
  return r.rows[0] ? c.json({ ok: true, listing: mapListing(r.rows[0]) }) : c.json({ error: 'Listing not found' }, 404);
});
app.patch('/api/listings/admin/:id', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const body = await c.req.json();
  const current = await pool.query('select * from marketplace_listings where id=$1', [c.req.param('id')]);
  if (!current.rows[0]) return c.json({ error: 'Listing not found' }, 404);
  const row = current.rows[0], price = body.price === undefined ? Number(row.price) : Number(body.price);
  if (!Number.isFinite(price) || price < 0) return c.json({ error: 'Invalid price' }, 400);
  const r = await pool.query('update marketplace_listings set title=$2,price=$3,price_type=$4,description=$5,town=$6,province=$7,updated_by=$8,updated_at=now() where id=$1 returning *', [c.req.param('id'), clean(body.title ?? row.title, 120), price, clean(body.priceType ?? row.price_type, 30), clean(body.description ?? row.description, 3000), clean(body.town ?? row.town, 80), clean(body.province ?? row.province, 60), 'u_admin_1']);
  return c.json({ ok: true, listing: mapListing(r.rows[0]) });
});
app.delete('/api/listings/admin/:id', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query('select * from marketplace_listings where id=$1', [c.req.param('id')]);
  if (!r.rows[0]) return c.json({ error: 'Listing not found' }, 404);
  const images = imageObjects(r.rows[0].images);
  await deleteImages(images);
  await pool.query('delete from marketplace_listings where id=$1', [c.req.param('id')]);
  return c.json({ ok: true, deletedId: c.req.param('id'), deletedImages: images.length });
});

app.post('/api/marketplace-live/admin/listing/:id/action', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const body = await c.req.json();
  const action = clean(body.action, 30);
  const sql = action === 'suspend' ? "update marketplace_listings set status='suspended',updated_at=now() where id=$1 returning id" : action === 'activate' ? "update marketplace_listings set status='active',approval_status='approved',updated_at=now() where id=$1 returning id" : '';
  if (!sql) return c.json({ error: 'Invalid action' }, 400);
  const r = await pool.query(sql, [c.req.param('id')]);
  return r.rows[0] ? c.json({ ok: true }) : c.json({ error: 'Listing not found' }, 404);
});
app.post('/api/marketplace-live/public/report/:id', async (c) => {
  const body = await c.req.json(); const reason = clean(body.reason, 500);
  if (reason.length < 5) return c.json({ error: 'Please provide a report reason' }, 400);
  const id = newId('report');
  await pool.query("insert into marketplace_reports(id,listing_id,reason,email,status) values($1,$2,$3,$4,'open')", [id, c.req.param('id'), reason, clean(body.email, 160)]);
  return c.json({ ok: true, reference: id });
});
app.get('/api/marketplace-live/admin/reports', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query('select id,listing_id as "listingId",reason,email,status,created_at as "createdAt" from marketplace_reports order by created_at desc'); return c.json(r.rows);
});
app.get('/api/marketplace-live/admin/messages', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const r = await pool.query('select id,listing_id as "listingId",seller_id as "sellerId",buyer_name as "buyerName",buyer_email as "buyerEmail",message,status,created_at as "createdAt" from marketplace_messages order by created_at desc'); return c.json(r.rows);
});
app.get('/api/marketplace-settings/public/demo-listings', (c) => c.json({ enabled: false, removed: true }));
app.get('/api/marketplace-settings/admin/demo-listings', (c) => isAdmin(c) ? c.json({ enabled: false, removed: true }) : c.json({ error: 'Unauthorized' }, 401));
app.post('/api/marketplace-settings/admin/demo-listings', (c) => isAdmin(c) ? c.json({ ok: true, enabled: false, removed: true }) : c.json({ error: 'Unauthorized' }, 401));

app.onError((err, c) => { console.error(err); return c.json({ error: err.message || 'Marketplace API error' }, 500); });
export default app;
