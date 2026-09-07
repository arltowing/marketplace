const r=require('express').Router();
const{requireRole}=require('../auth');
r.get('/public/demo-listings',(req,res)=>res.json({enabled:false,removed:true}));
r.get('/admin/demo-listings',requireRole('admin'),(req,res)=>res.json({enabled:false,removed:true,scope:'server'}));
r.post('/admin/demo-listings',requireRole('admin'),(req,res)=>res.json({ok:true,enabled:false,removed:true,scope:'server'}));
module.exports=r;
