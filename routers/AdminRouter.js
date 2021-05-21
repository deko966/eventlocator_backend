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

    if (!token || token == -1 ) {
        return res.status(401).render('index',{
            message:"something wrong"
        })
    }

    res.cookie('Authorization', `Bearer ${token}`).end();
})

router.get('/pending/all', auth.authAdmin, async (req,res)=>{

    const allPending = await AdminModel.getallpendingInfo()
    if(!allPending){
        res.send(404)
    }
    const organizer = allPending[0]
    const event = allPending[1]
    res.render('allPendingInfo', {
        organizer,
        event,
    });
})

router.get('/organizers/edit/:organizerId', auth.authAdmin, async (req,res)=>{
  
    const organizer = await AdminModel.getPendingOrganizerInfo(req.params.organizerId)
    
    if(organizer == undefined ){
        res.send(404)
    }
    res.render('organizerDetailsPage', {
        organizer,
        
    });
})

router.get('/events/edit/:eventId',auth.authAdmin,async (req,res)=>{
    const allEventInfo = await AdminModel.getPendingEventInfo(req.params.eventId);
    if(!allEventInfo){
        res.send(404)
    }
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
  
    organizerInfo = await AdminModel.getPendingOrganizerInfo(req.params.organizerId)
    organizer = await AdminModel.setResponseOrganizer(req.params.organizerId,req.adminID,req.params.response)
    if(req.params.response == 0){
        const subject = "Account accepted"
        const text = "Dear "+ organizerInfo[0].name+",\nWe are happy to inform you that your account has been accepted and you can now login and create events.\nIf you face any issues, please don’t hesitate to contact this email for help.\n\n\nKind regards.\nEvent Locator team. " 
        emailUtils.sendOneEmail(organizerInfo[0].email,subject,text)
        return res.status(200).redirect('/pending/all')
    }

    if(req.params.response == 1){
        const subject = "Account rejected"
        const text = "Dear "+ organizerInfo[0].name+",\nWe are sorry to inform you that your account has been rejected.\nIf you feel like this was unfair, please feel free to contact us using this email.\n\n\nKind regards. \nEvent Locator team. " 
        emailUtils.sendOneEmail(organizerInfo[0].email,subject,text)
        return res.status(200).redirect('/pending/all')
    }
   
 
})


router.get('/event/:organizerId/:eventId/:response',auth.authAdmin,async (req,res)=>{
    organizerInfo = await AdminModel.getPendingOrganizerInfo(req.params.organizerId)
    organizer = await AdminModel.setResponseEvent(req.params.eventId,req.adminID,req.params.response)
    const allEventInfo = await AdminModel.getPendingEventInfo(req.params.eventId);
    const event = allEventInfo[0]
    if(req.params.response == 0){
        const subject = "Event accepted"
        const text = "Dear "+ organizerInfo[0].name+",\nWe are happy to inform you that your event" + event.name +" has been accepted, and is now visible for participants and they are able to register in it.\nIf you face any issues, please don’t hesitate to contact this email for help.\n\n\nKind regards.\nEvent Locator team. " 
        emailUtils.sendOneEmail(organizerInfo[0].email,subject,text)
        return res.status(200).redirect('/pending/all')
    }
    if(req.params.response == 1){
        const subject = "Event rejected"
        const text = "Dear "+ organizerInfo[0].name+",\nWe are sorry to inform you that your event " + event.name +" has been rejected.\nIf you feel like this was unfair, please feel free to contact us using this email.\n\n\n Kind regards.\n Event Locator team. " 
        emailUtils.sendOneEmail(organizerInfo[0].email,subject,text)
        return res.status(200).redirect('/pending/all')
    }

    
})

module.exports = router