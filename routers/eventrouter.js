const express = require('express')
const router = new express.Router()
const eventModule = require('../models/Event')


router.post('/CreateEvent',async (res,req)=>{

    const event = await eventModule.createEvent(req.body)
    if(event.err)
    res.status(500).send(event.err)
    else{

        res.status(200).send(event)
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
router.get('/EventInfo/:id',async (req,res)=>{
    const event = await eventModule.eventDetails(req.params.id)
})
router.get('/UpComingEvents/:id',async (req,res)=>{

})
router.get('/RegisterInEvent/:id',async (req,res)=>{
    const event = await eventModule.ParticipantRegisterEvent(req.params.id)
    if(event.err)
    res.status(500).send(event.err)
    else{

        res.status(200).send(event)
    }

})
router.get('/UnregisterInEvent',async (req,res)=>{

})
router.post('/RateEvent/:id',async (req,res)=>{

})
router.post('/FollowedOrganizers',async (req,res)=>{

})

module.exports = router