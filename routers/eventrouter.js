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
        res.status(201).send(eventResult.toString())
    else{
        if(eventResult.includes("ER_DUP_ENTRY"))
            res.send(409)
        else if(eventResult.includes("ER_NO_REFERENCED"))
                res.send(406)
        else res.send(500)
    }
    }
    catch(e){
        console.log(e)
        res.send(500)
    }

})

router.get("/organizers/events/limited/:id/participants", auth.authOrganizer, async (req, res) =>{
    try{
        const participants = await eventModel.getParticipantsDuringALimitedLocatedSession(req.params.id)
        if (participants == null) res.status(404)
        else res.status(200).send(participants)
    }
    catch(e){
        res.send(500)
    }
})


router.get('/participants/events/upcoming',auth.authParticipant, async (req,res) =>{
   try{ const events = await eventModel.getUpcomingEvents(req.participantID)
    if(events != null)
    res.status(202).send(events)
    else res.send(404)
}
    catch(e){
    res.send(500)
}
})

router.get('/organizers/events',auth.authOrganizer,async (req,res) =>{
   try{
        const events = await eventModel.getOrganizerEvents(req.authOrganizerInfo.id)
        if(events.failure){
            res.send(500)
        }
        else if (events.length ==0){
            res.send(404)
        }
        else res.status(200).send(events)
    }
    catch(e){
        res.send(500)
    }
})

router.get('/participants/events',auth.authParticipant, async (req,res) =>{
  try{
    const events = await eventModel.getParticipantEvents(req.participantID)
    if(events != null){
        res.status(202).send(events)
    }
    else if(events == null)res.send(404)
  }
  catch(e){
      res.send(500)
  }
})

router.get('/organizers/events/:id/feedback', auth.authOrganizer, async (req,res)=>{
    try{
        const feedback = await eventModel.getEventsFeedback(req.params.id)
        if(feedback != null)
        res.status(200).send(feedback)
        else{
            res.send(404)
        }
    }
    catch(e){
        res.send(500)
    }
}),




router.get('/organizers/events/:id',auth.authOrganizer,async (req,res) =>{
   try{
    const event = await eventModel.getEventByID(req.params.id)
    if (event==null){
        res.send(404)
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
            res.send(200)
        }
        catch(e){
            res.send(500)
        }
})

router.get('/organizers/events/:eventID/session/:sessionID/participant/:participantID', 
    auth.authOrganizer, async (req, res) =>{
        try{
            const res = await eventModel.prepareToCheckInParticipant(req.params.eventID, req.params.sessionID, req.params.participantID, req.authOrganizerInto.id)
            if (res == 1) res.send(404)
            else if (res == 2) res.send(409)
            else res.status(200).send(res)
        }
        catch(e){
            res.send(500)
        }
})




router.get('/participants/organizer/:id/events', auth.authParticipant, async (req,res) =>{
  try{  
    const events = await eventModel.getOrganizerEventsForParticipantsApp(req.participantID,req.params.id)
    if(events != null)
    res.status(202).send(events)
    else{
        res.send(404)
    }
}
catch(e){
    res.send(500)
}

})


router.get('/participants/events/upcomingByFollowedOrganizers',auth.authParticipant, async (req,res) =>{
    try{
        const events = await eventModel.getUpcomingEventsByFollowedOrganizers(req.participantID)
        if(events != null)
        res.status(202).send(events)
        else{

            res.send(404)
        }
    }
    catch(e){
        res.send(500)
    }
})




router.get('/participants/event/:id',auth.authParticipant, async (req,res)=>{
   try{
    const event = await eventModel.getEventByIdForParticipant(req.participantID,req.params.id)
    if(event != null){
        res.status(202).send(event)
    }
    else{
        res.send(404)
    }
}
    catch(e){
        res.send(500)
    }
})

router.post('/participants/event/:id/rate',auth.authParticipant, async (req,res)=>{

    try{
        const result = await eventModel.addParticipantRating(req.participantID, req.params.id, req.body)
        if(result == null)
        res.send(200)
        else if(result.includes("ER_DUP_ENTRY"))
            res.send(409)
        else if(result.includes("ER_NO_REFERENCED"))
            res.send(406)
        else res.send(500)
    }
    catch(e){
        res.send(500)
    }

})


router.post('/organizers/events/:id/cancel/:late',auth.authOrganizer,async (req,res) => {
    try{
        eventResult = await eventModel.cancelEvent(req.body,req.params.id, req.params.late, req.authOrganizerInfo.id)
        if(eventResult == null)
        res.send(200)
        else if(eventResult.includes("ER_DUP_ENTRY"))
            res.send(409)
        else if(eventResult.includes("ER_NO_REFERENCED"))
            res.send(406)
        else res.send(500)
    }
    catch(e){  
        res.send(500)
    }
})


router.get('/organizers/events/:id/participants',auth.authOrganizer, async (req,res) =>{
    try{
        const participants =await eventModel.getParticipantsOfAnEvent(req.params.id)
        if(participants!=null){
        res.status(200).send(participants)
        }
        else{
            res.send(404)
        }
    }
    catch(e){
        res.send(500)
    }
})


router.get('/organizers/events/:id/attendanceStatistics', auth.authOrganizer, async (req,res) => {

    try{
        const data = await eventModel.getEventStatistics(req.params.id)
        res.status(200).send(data)
    }
    catch(e){
        res.send(500)
    }

})

router.post('/organizers/events/:id/emailParticipants', auth.authOrganizer, async (req, res) => {
    try{
        const result = await eventModel.emailParticipantsOfAnEvent(req.params.id, req.body)
        if (result == 404){
            res.send(404)
        }
        else{
            res.send(200)
        }
    }
    catch(e){
        res.send(500)
    }
})

router.patch('/organizers/events/:id/editPending', auth.authOrganizer, uploads.single('image'), async (req,res) => {
    try{
        const event = JSON.parse(req.body.event)
        let image = undefined
        if (req.file) image = req.file.buffer
        const result = await eventModel.editPendingEvent(req.params.id, event, req.authOrganizerInfo.id, image)
        if (result.code && result.id)
            res.status(result.code).send(result.id.toString())
        else if(result.code) res.send(result.code)
        else res.send(500)
    }
    catch(e){
        res.send(500)
    }
})

router.patch('/organizers/events/:id/editConfirmed', auth.authOrganizer, async (req,res) => {
    try{
        const result = await eventModel.editConfirmedEvent(req.params.id, req.body, req.authOrganizerInfo.id)
        if (result == null) res.send(201)
        else res.send(500)

    }
    catch(e){
        res.send(500)
    }


})



module.exports = router