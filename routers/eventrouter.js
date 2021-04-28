const express = require('express')
const router = new express.Router()
const eventModel = require('../models/Event')
const auth = require('../middleware/auth')
const  multer = require('multer');
const { compareSync } = require('bcryptjs');
const e = require('express');

const uploads = multer({
    limits: {
    fileSize: 16000000,
    },
  
  })


   

router.post('/organizers/events/create',auth.authOrganizer,uploads.single('image'),async (req,res)=>{
    try{
    const eventData = JSON.parse(req.body.event)
    eventResult = await eventModel.createEvent(eventData,req.authOrganizerInfo,req.file)
    if(!isNaN(eventResult))
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

router.get("/organizers/events/limited/:id/participants", auth.authOrganizer, async (req, res) =>{
    try{
        const participants = await eventModel.getParticipantsDuringALimitedLocatedSession(req.params.id)
        if (participants == null) res.status(404)
        else res.status(200).send(participants)
    }
    catch(e){
        res.status(500)
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
    const events = await eventModel.getOrganizerEvents(req.authOrganizerInfo.id)
        if(events != null){
            res.status(200).send(events)
        }
        else{
            res.status(404)
    }
    }
    catch(e){
        res.status(500)
    }
})

router.get('/participants/events',auth.authParticipant, async (req,res) =>{
  try{
    const events = await eventModel.getParticipantEvents(req.participantID)
    if(events != null){
        res.status(202).send(events)
    }
    else{
        res.status(404)
    }
  }
  catch(e){
      res.status(500)
  }
})

router.get('/organizers/events/:id/feedback', auth.authOrganizer, async (req,res)=>{
    try{
        const feedback = await eventModel.getEventsFeedback(req.params.id)
        if(feedback != null)
        res.status(200).send(feedback)
        else{
            res.status(404)
        }
    }
    catch(e){
        res.status(500)
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

router.get('/organizers/events/:eventID/session/:sessionID/participant/:participantID/confirm', 
    auth.authOrganizer, async (req, res) =>{
    
        try{
            await eventModel.checkInParticipant(req.params.eventID, req.params.sessionID, req.params.participantID)
            res.sendStatus(200)
        }
        catch(e){
            res.sendStatus(500)
        }

})

router.get('/organizers/events/:eventID/session/:sessionID/participant/:participantID', 
    auth.authOrganizer, async (req, res) =>{
        try{
            const res = await eventModel.prepareToCheckInParticipant(req.params.eventID, req.params.sessionID, req.params.participantID, req.authOrganizerInto.id)
            if (res == 1) res.sendStatus(404)
            else if (res == 2) res.sendStatus(409)
            else res.status(200).send(res)
        }
        catch(e){
            res.sendStatus(500)
        }
})





router.get('/participants/organizer/:id/events', auth.authParticipant, async (req,res) =>{
  try{  
    const events = await eventModel.getOrganizerEventsForParticipantsApp(req.participantID,req.params.id)
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

router.get('/participants/event/:id/rate',auth.authParticipant, async (req,res)=>{

    try{
        const result = await eventModel.addParticipantRating(req.participantID, req.params.id, req.body)
        if(result == null)
        res.sendStatus(200)
        else
        if(result.includes("ER_DUP_ENTRY"))
            res.sendStatus(409)
        else
            if(result.includes("ER_NO_REFERENCED"))
            res.sendStatus(406)
    }
    catch(e){
        res.status(500)
    }

})


router.post('/organizers/events/:id/cancel/:late',auth.authOrganizer,async (req,res) => {
    try{
        eventResult = await eventModel.cancelEvent(req.body,req.params.id, req.params.late, req.authOrganizerInfo.id)
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
        console.log(e)
        res.status(500)

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


router.get('/organizers/events/:id/attendanceStatistics', auth.authOrganizer, async (req,res) => {

    try{
        const data = await eventModel.getEventStatistics(req.params.id)
        res.sendStatus(200)
    }
    catch(e){
        res.sendStatus(500)
    }

})

router.post('/organizers/events/:id/emailParticipants', auth.authOrganizer, async (req, res) => {
    try{
        const result = await eventModel.emailParticipantsOfAnEvent(req.params.id, req.body)
        if (result == 404){
            res.status(404)
        }
        else{
            res.status(200)
        }
    }
    catch(e){
        res.status(500)
    }
})



module.exports = router