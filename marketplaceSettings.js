const r=require('express').Router();
const{requireRole}=require('../auth');const{readDb,writeDb,addEvent}=require('../db');
r.get('/public/demo-listings',(req,res)=>{const db=readDb();res.json({enabled:db.settings?.demoListingsEnabled!==false})});
r.get('/admin/demo-listings',requireRole('admin'),(req,res)=>{const db=readDb();res.json({enabled:db.settings?.demoListingsEnabled!==false,scope:'server'})});
r.post('/admin/demo-listings',requireRole('admin'),(req,res)=>{const db=readDb();db.settings=db.settings||{};db.settings.demoListingsEnabled=req.body.enabled===true;writeDb(db);addEvent('admin.demo_listings_changed','Admin changed demo listing visibility',{enabled:db.settings.demoListingsEnabled,adminId:req.currentUser.id});res.json({ok:true,enabled:db.settings.demoListingsEnabled,scope:'server'})});
module.exports=r;