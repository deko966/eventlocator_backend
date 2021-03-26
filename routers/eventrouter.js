const express = require('express')
const router = new express.Router()
const eventModel = require('../models/Event')
const auth = require('../middleware/auth')
const  multer = require('multer');

const uploads = multer({
    limits: {
    fileSize: 16000000,
    },
  
  })
   

router.post('/organizers/events/create',auth.authOrganizer,uploads.single('image'),async (req,res)=>{
   
    try{
    const eventData =  JSON.parse(req.body.event)
    await eventModel.createEvent(eventData,req.authOrganizerInfo,req.file)
    res.sendStatus(201)
    }
    catch(e){
        res.status(401).send(e)
    }

})





router.post('/organizers/events/:id/cancel',auth.authOrganizer,async (req,res) => {
    try{
    await eventModel.canceledEvent(req.body,req.params.id)
    res.sendStatus(200)
    }
    catch(e){
    res.status(400).send(e)
    
    }
})

router.get('/EventInfo/:id',async (req,res)=>{
    try{
    const event = await eventModel.getEventDetails(req.params.id)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.get('/organizers/events/participants/:id',auth.authOrganizer, async (req,res) =>{
    const participants =await eventModel.getParticipantsOfAnEvent(req.params.id)
    if(participants!=null){
    res.status(200).send(participants)
    }
    else{
        res.status(404).send("no participants")
    }
})

router.get('/registerInEvent/:id',async (req,res)=>{
    
    const event = await eventModel.ParticipantRegisterEvent(req.params.id)
    if(event!=null){
        res.sendStatus(201)
    }
    else{
        res.status(400).send(e)
    }

})
router.get('/organizers/events/feedback/:id',async (req,res)=>{
    const feedback = await eventModel.getEventsFeedback(req.params.id)
    if(feedback != null)
    res.status(200).send(feedback)
    else{
        res.status(404).send("no event/feedback")
    }
}),

router.get('/organizers/events/:id',auth.authOrganizer,async (req,res) =>{
    
        const event = await eventModel.getEventDetailsByID(req.params.id)
        if(event != null){
            res.status(200).send(event)
        }
        else{
            res.status(404).send("event not found")
    }

})

router.get('/organizers/events',auth.authOrganizer,async (req,res) =>{
    const events = await eventModel.getOrganizerEvents(req.authOrganizerInfo)
        if(events != null){
            res.status(200).send(events)
        }
        else{
            res.status(404).send("event not found")
    }
})


router.patch('/ModifyEvent',async (req,res)=>{
//2-	PATCH: modify event, takes an Event object (all checks relating to status changes and organizer’s rating penalty are here, 
// applies penalty for participants who did not attend it, and removes penalty
//  for those who attends and already have a penalty. Sends notification 
//  if event is confirmed and times or location change)
})
router.get('/EventParticipants/:id',async (req,res)=>{

})
router.get('/L_L_E_Participant/:id/session/:Sid',async (req,res)=>{

})
router.get('/OneParticipant',async (req,res)=>{

})
router.post('/CheckIn/:id/session/:Sid',async (req,res)=>{

})
router.post('/SendEmail/:id',async (req,res)=>{

})


router.get('/UpComingEvents/:id',async (req,res)=>{

})

router.get('/UnregisterInEvent',async (req,res)=>{

})
router.post('/RateEvent/:id',async (req,res)=>{

})


module.exports = router