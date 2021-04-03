const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModel = require('../models/Participant')
const auth = require('../middleware/auth')
const { authParticipant } = require('../middleware/auth')
//use the req and the create variables that can be stored in the req 


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





router.post('/participant/login',async (req,res)=>{
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

router.post('/participants/follow/organizer/:id',auth.authParticipant,async (req,res)=>{
    try{
    const participant = await ParticipantModel.followOrganizer(req.params.id,req.participantID)
    res.sendStatus(200)
    }
    catch(e){
        res.sendStatus(500)
    }

})

router.get('/participants/organizers/followed', auth.authParticipant, async(req,res)=>{
    try{
     const organizers = await ParticipantModel.organizerFollowedByParticipant(req.participantID)
     if(organizers != null){
         res.status(202).send(organizers)
     }
     else{
         res.sendStatus(404)
     }
 }
     catch(e){
         res.status(500).send(e)
     }
 })
 

router.post('/participants/unfollow/organizer/:id',auth.authParticipant,async (req,res)=>{
    try{
    const participant = await ParticipantModel.unfollowOrganizer(req.params.id,req.participantID)
    res.sendStatus(200)
    }
    catch(e){
        res.sendStatus(500)
    }
})



router.get('/participants/event/:id/register', auth.authParticipant, async(req,res)=>{
    
  try{  
    await ParticipantModel.participantRegisterInEvent(req.participantID,req.params.id)
      res.sendStatus(202)
    }
    catch(e){
        res.sendStatus(406)
    }
})


router.post('/participants/event/:id/register', auth.authParticipant, async(req,res)=>{
    
    try{  
      await ParticipantModel.participantRegisterInEvent(req.participantID,req.params.id)
        res.sendStatus(202)
      }
      catch(e){
          res.sendStatus(406)
      }
  })

  router.post('/participants/event/:id/unregister', auth.authParticipant, async(req,res)=>{
    
    try{
        await ParticipantModel.participantUnregisterInEvent(req.participantID,req.params.id)
        res.sendStatus(202)
    }
    catch(e){     
         res.sendStatus(406)
     }
  })  



// router.patch('/ModifyParticipantProfile',auth,async (req,res)=>{

// })
// router.get('/ParticipantInfo',auth,async (req,res)=>{
// 
// })
// router.get('/OrganizersInfo',auth,async (req,res)=>{

// })





module.exports = router