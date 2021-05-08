const express = require('express')
const AdminModel = require('../models/Admin')
const auth = require('../middleware/auth')
const router = new express.Router()
const emailUtils = require('../utils/emailUtils');




router.post('/signup/admin',async (req,res)=>{
    
    await AdminModel.signup(req.body)   
}),


router.post('/admin/login',async (req,res)=>{   
    const token = await AdminModel.login(req.body)

    if (!token) {
        req.flash('error', 'erroroor');
        return res.status(401).redirect('index')
    }

    res.cookie('Authorization', `Bearer ${token}`).end();
})

router.get('/pending/all', auth.authAdmin, async (req,res)=>{

    const allPending = await AdminModel.getallpendingInfo()
    const organizer = allPending[0]
    const event = allPending[1]
    res.render('allPendingInfo', {
        data:organizer,
        event,
        error:"wrong details"
    });
})

router.get('/organizers/edit/:organizerId', auth.authAdmin, async (req,res)=>{
  
    const organizer = await AdminModel.getPendingOrganizerInfo(req.params.organizerId);

    res.render('organizerDetailsPage', {
        organizer,
        
    });
})

router.get('/events/edit/:eventId',auth.authAdmin,async (req,res)=>{
    const allEventInfo = await AdminModel.getPendingEventInfo(req.params.eventId);
    const event = allEventInfo[0]
    const organizer = allEventInfo[1]
    const session = allEventInfo[2]
    const categories = allEventInfo[3]
    const locatedevent = allEventInfo[4]
 
    res.render('eventDetailsPage', {
        event,
        organizer,
        session,
        categories,
        locatedevent
        
    });

})

    
router.get('/admin/logout',auth.authAdmin,async (req,res)=>{
 
    res.clearCookie('Authorization');
    return res.status(200).redirect('/');
   
})

router.get('/account/:organizerId/:response',auth.authAdmin,async (req,res)=>{
  
    organizerEmail = await AdminModel.getPendingOrganizerInfo(req.params.organizerId)
    organizer = await AdminModel.setResponseOrganizer(req.params.organizerId,req.adminID,req.params.response)
    // emailUtils.sendOneEmail('adel.minwer66@gmail.com',subject,text)
    return res.status(200).redirect('/pending/all')
 
})


router.get('/event/:organizerId/:eventId/:response',auth.authAdmin,async (req,res)=>{
    organizerEmail = await AdminModel.getPendingOrganizerInfo(req.params.organizerId)
    organizer = await AdminModel.setResponseEvent(req.params.eventId,req.adminID,req.params.response)
    // emailUtils.sendOneEmail('adel.minwer66@gmail.com',subject,text)
    return res.status(200).redirect('/pending/all')
})

module.exports = router