const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModel = require('../models/Participant')
const auth = require('../middleware/auth')
//use the req and the create variables that can be stored in the req 

router.post('/participants/signup/partial',async (req,res)=>{
    
    try{
    const participant = await ParticipantModel.partialSignup(req.body)
        
    if(participant == null){
        res.sendStatus(200)
    }

    else{    
        res.sendStatus(409)
    }
    }
    catch(e){
        res.sendStatus(500)
    }
})

router.post('/participants/signup',async (req,res)=>{

       try{ const participant = await ParticipantModel.createParticipant(req.body)
        
        if(participant == 1){
            res.sendStatus(409)
        }
        else{   
        res.sendStatus(200)
        }
    }
    catch(e){
        res.sendStatus(500)
    }

})



router.post('/participantLogin',async (req,res)=>{
    try{ 
        const token = await ParticipantModel.login(req.body)
        if (token != null)
            res.status(202).send(token)
        else
        if (token == null)
            res.sendStatus(404)
}
    catch(e){
        res.sendStatus(500)
    }
}),


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