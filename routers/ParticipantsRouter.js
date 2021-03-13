var mysql = require('mysql');
const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModule = require('../models/Participant')
const auth = require('../middleware/auth')
//use the req and the create variables that can be stored in the req 


router.post('createParticipant',async (req,res)=>{
    const participant = await ParticipantModule.createParticipant(req.body)
    if(participant.err)

    res.status(500).send(participant.err)
    
    else{

        res.status(200).send(participant)
    }

})
router.post('/participantLogin',async (req,res)=>{

    const participant = await ParticipantModule.login(req)
    if(participant.err)
    res.status(500).send(participant.err)
    else{
       const token = await auth.createParticipantToken(req.body)
        res.status(200).send(token)
    }
})

// router.patch('/ModifyParticipantProfile',auth,async (req,res)=>{

// })
// router.get('/ParticipantInfo',auth,async (req,res)=>{
// 
// })
// router.get('/OrganizersInfo',auth,async (req,res)=>{

// })
// router.get('/OrganizerByName/:name',auth,async (req,res)=>{

// })

// router.get('/FollowOrganizer/:id',auth,async (req,res)=>{

// })
// router.patch('/unFollowOrganizer/:id',auth,async (req,res)=>{

// })

module.exports = router