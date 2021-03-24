var mysql = require('mysql');
const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModule = require('../models/Participant')
const auth = require('../middleware/auth')
//use the req and the create variables that can be stored in the req 


router.post('/createParticipant',async (req,res)=>{
    const participant = await ParticipantModule.createParticipant(req.body)
    if(participant.err)

    res.status(500).send(participant.err)
    
    else{

        res.status(200).send(participant)
    }

})


router.post('/participantLogin',async (req,res)=>{

    const participant = await ParticipantModule.login(req.body)
    res.status(200).send(token)
    }
)


router.get('/organizerByName/:name',auth.authParticipant ,async (req,res)=>{
    const participant = await ParticipantModule.getOrganizer(req.params.name)
    if(participant.err)
        res.status(500).send(participant.err)
    else{
       res.status(200).send(participant)
    }
})  

router.get('/FollowOrganizer/:id',auth.authParticipant,async (req,res)=>{
    const participant = await ParticipantModule.getOrganizer(req.params.id,req.participantID)
    if(participant.err)
        res.status(500).send(participant.err)
    else{
       res.sendStatus(200).send("success")
    }
})

// router.patch('/unFollowOrganizer/:id',auth.authParticipant,async (req,res)=>{
//     const unfollow = await participant.unfollowOrganizer(req.params.id)
//     if(participant.err)
//         res.status(500).send(participant.err)
//     else{
//         res.status(200)
// }
// })

// router.patch('/ModifyParticipantProfile',auth,async (req,res)=>{

// })
// router.get('/ParticipantInfo',auth,async (req,res)=>{
// 
// })
// router.get('/OrganizersInfo',auth,async (req,res)=>{

// })





module.exports = router