const express = require('express')
const AdminModel = require('../models/Admin')
const auth = require('../middleware/auth')
const router = new express.Router()




router.post('/signup/admin',async (req,res)=>{
    
    await AdminModel.signup(req.body)   
}),


router.post('/admin/login',async (req,res)=>{   
    const token = await AdminModel.login(req.body)

    if (!token) {
        res.status(401).end()
        return;
    }

    res.cookie('Authorization', `Bearer ${token}`).end();
})

router.get('/pending/all', auth.authAdmin, async (req,res)=>{
    const allPending = await AdminModel.getallpendingInfo()
    const organizer = allPending[0]
    const event = allPending[1]
    res.render('allPendingInfo', {
        organizer,
        event,
    });
})

router.get('/organizers/edit/:organizerId', auth.authAdmin, async (req,res)=>{
    const organizer = await AdminModel.getPendingOrganizerInfo(req.params.organizerId);

    res.render('organizerDetailsPage', {
        organizer,
        
    });
})

router.get('/events/edit/:eventId',auth.authAdmin,async (req,res)=>{
    const event = await AdminModel.getPendingEventInfo(req.params.eventId);

    res.render('eventDetailsPage', {
        event,
        
    });

})

    
router.get('/admin/logout',auth.authAdmin,async (req,res)=>{
 
    res.clearCookie('Authorization');
    return res.status(200).redirect('/');
   
})

router.post('/account/response',async (req,res)=>{
    
})


// router.post('/ResponseToEvent/:id',auth,async (req,res)=>{

// })

module.exports = router