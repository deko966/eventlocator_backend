const express = require('express')
const router = new express.Router()


router.get('/adminLogin',async (req,res)=>{
    try{ 
    
        const token = await AdminModel.login(req.body)   
        if (token != null)
           return res.redirect('');
        else if (token == null)
                res.sendStatus(404)
    }
    
    catch(e){
            res.sendStatus(500)
        }
}),
    
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