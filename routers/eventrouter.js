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
    const eventData = JSON.parse(req.body.event)
    eventResult = await eventModel.createEvent(eventData,req.authOrganizerInfo,req.file)
    if(eventResult==undefined)
    res.sendStatus(201)
    else{
        if(eventResult.includes("ER_DUP_ENTRY"))
            res.sendStatus(409)
        else{
            if(eventResult.includes("ER_NO_REFERENCED"))
                res.sendStatus(406)
        }
    }
    }
    catch(e){
        res.sendStatus(500)
    }

})


router.get('/participants/events/upcoming',auth.authParticipant, async (req,res) =>{
   try{ const events = await eventModel.getUpcomingEvents(req.participantID)
    if(events != null)
    res.status(202).send(events)
    else{
        res.sendStatus(404)
    }
}
    catch(e){
    res.sendStatus(500)
}
})

router.get('/organizers/events',auth.authOrganizer,async (req,res) =>{
   try{
    const events = await eventModel.getOrganizerEvents(req.authOrganizerInfo)
        if(events != null){
            res.status(200).send(events)
        }
        else{
            res.status(404).send("event not found")
    }
    }
    catch(e){
        res.sendStatus(500)
    }
})

router.get('/participants/events',auth.authParticipant, async (req,res) =>{
  try{
    const events = await eventModel.getParticipantEvents(req.participantID)
    if(events != null){
        res.status(202).send(events)
    }
    else{
        res.sendStatus(404)
    }
  }
  catch(e){
      res.sendStatus(500)
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
   try{
    const event = await eventModel.getEventByID(req.params.id)
    if (event==null){
        res.status(404)
    }
    else {
        res.status(200).send(event)
    }
    }
    catch(e){
        res.send(500)
    }
})






router.get('/participants/organizer/:id/events', async (req,res) =>{
  try{  
    const events = await eventModel.getOrganizerEventsForParticipantsApp(req.body.id)
    if(events != null)
    res.status(202).send(events)
    else{
        res.sendStatus(404)
    }
}
catch(e){
    res.sendStatus(500)
}

})


router.get('/participants/events/upcomingByFollowedOrganizers',auth.authParticipant, async (req,res) =>{
    try{
    const events = await eventModel.getUpcomingEventsByFollowedOrganizers(req.participantID)
    if(events != null)
    res.status(202).send(events)
    else{

        res.sendStatus(404)
    }
}
    catch(e){
        res.sendStatus(500)
    }
})




router.get('/participants/event/:id',auth.authParticipant, async (req,res)=>{
   try{
    const event = await eventModel.getEventByIdForParticipant(req.participantID,req.params.id)
    if(event != null){
        res.status(202).send(event)
    }
    else{
        res.sendStatus(404)
    }
}
    catch(e){
        res.sendStatus(500)
    }
})


router.post('/organizers/events/:id/cancel/:late',auth.authOrganizer,async (req,res) => {
    try{
        eventResult = await eventModel.canceledEvent(req.body,req.params.id, req.params.late, req.authOrganizerInfo.id)
        if(eventResult == null)
        res.sendStatus(200)
        else
        if(eventResult.includes("ER_DUP_ENTRY"))
            res.sendStatus(409)
        else
            if(eventResult.includes("ER_NO_REFERENCED"))
            res.sendStatus(406)
    }
    catch(e){  
        res.status(500).send(e)

    }
})


router.get('/organizers/events/:id/participants',auth.authOrganizer, async (req,res) =>{
    try{
    const participants =await eventModel.getParticipantsOfAnEvent(req.params.id)
    if(participants!=null){
    res.status(200).send(participants)
    }
    else{
        res.status(404)
    }
    }
    catch(e){
        res.send(500)
    }
})


router.get('/organizers/events/getAttendanceInfo/:id', async (req,res) => {


}
)

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