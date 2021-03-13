const express = require('express')
const router = new express.Router()


router.post('/AdminLogin',async (req,res)=>{
    
})
router.post('/AdminLogut',auth,async (req,res)=>{

})
router.get('/pendingAccounts',auth,async (req,res)=>{

})
router.get('/OrganizerInfo/:id',auth,async (req,res)=>{

})
router.post('/ResponseToAccount/:id',auth,async (req,res)=>{

})
router.get('/PedningEvents',auth,async (req,res)=>{

})
router.get('/EventInfo/:id',auth,async (req,res)=>{

})
router.post('/ResponseToEvent/:id',auth,async (req,res)=>{

})
module.exports = router