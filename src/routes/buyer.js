const r=require('express').Router();r.get('/order-status',(req,res)=>res.json({status:'preview'}));module.exports=r;
