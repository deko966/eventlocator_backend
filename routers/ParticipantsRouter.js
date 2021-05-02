const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModel = require('../models/Participant')
const auth = require('../middleware/auth')
const { authParticipant } = require('../middleware/auth')
//use the req and the create variables that can be stored in the req 


router.post('/participants/signup',async (req,res)=>{
    try{
    const participant = await ParticipantModel.createParticipant(req.body) 
    if(participant==undefined)
        res.status(201).send()
    if(participant.includes("ER_DUP_ENTRY")){
        res.status(409).send()
    }
} 
    catch(e){
        res.status(500).send()

    }
})


router.post('/participants/signup/partial',async (req,res)=>{
    
    try{
    const participant = await ParticipantModel.partialSignup(req.body)
      
    if(participant== null){
        res.status(200).send()
    }

    else{    
        res.status(409).send()
    }
    }
    catch(e){
        res.status(500).send()
    }
})


router.get('/participants/organizers/all',async (req,res) =>{
    try{
        const organizers = await ParticipantModel.getAllOrganizers()
        if(organizers.length==0){
            res.status(404).send()
        }
        else{
            res.status(200).send(organizers)
        }
    }
    catch(e){
        res.status(500).send()
    }
    
})


router.post('/participants/login',async (req,res)=>{
  
    try{ 
        const token = await ParticipantModel.login(req.body)
        if (token != null)
            res.status(202).send(token)
        else
        if (token == null)
            res.status(404).send()
}
    catch(e){
        res.status(500).send()
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
    const follow = await ParticipantModel.followOrganizer(req.params.id,req.participantID)
   if(follow == null)
    res.status(200).send()
    
    else{
        if(follow.includes("ER_DUP_ENTRY"))
            res.status(409).send()
        else{
            if(follow.includes("ER_NO_REFERENCED"))
                res.status(406).send()
        }
    }
}
    catch(e){
        res.status(500).send()
    }

})

router.get('/participants/organizers/followed', auth.authParticipant, async(req,res)=>{
    try{
     const organizers = await ParticipantModel.getOrganizersFollowedByParticipant(req.participantID)
     if(organizers != null){
         res.status(202).send(organizers)
     }
     else{
         res.status(404).send()
     }
    }
     catch(e){
        
         res.status(500).send()
     }
 })
 

router.post('/participants/unfollow/organizer/:id',auth.authParticipant,async (req,res)=>{
    try{
    await ParticipantModel.unfollowOrganizer(req.params.id,req.participantID)
    if(follow == null)
    res.status(200).send()
    
    else{
        if(follow.includes("ER_DUP_ENTRY"))
            res.status(409).send()
        else{
            if(follow.includes("ER_NO_REFERENCED"))
                res.status(406).send()
        }
    }
}
    catch(e){
        res.status(500).send()
    }

})

router.get('/participants/organizer/:id', auth.authParticipant, async(req,res)=>{
    try{
    const organizer = await ParticipantModel.getOrganizerByID(req.params.id,req.participantID)
    if(organizer!=undefined)
    res.status(202).send(organizer)
      else{
          res.status(404).send()
      }
    }
    catch(e){
        res.status(500).send()
    }
})

router.get('/participant/information', auth.authParticipant, async(req,res) =>{
   try{
    const participant = await ParticipantModel.getParticipantByID(req.participantID)
    if(participant!=undefined)
      res.status(202).send(participant)
      else{
          res.status(404).send()
      }
    }
    catch(e){
        res.status(500).send()
    }
    

})

router.post('/participants/event/:id/register', auth.authParticipant, async(req,res)=>{
    try{
    const registration = await ParticipantModel.participantRegisterInEvent(req.participantID,req.params.id)
    if (registration == undefined) res.sendStatus(202)
    else if(registration == -1|| registration.includes("ER_DUP_ENTRY"))
        res.status(409).send()
    else{
        if(registration.includes("ER_NO_REFERENCED"))
        res.status(406).send()
    }
    }
    catch(e){
        res.status(500).send()
    }
  })

  router.post('/participants/event/:id/unregister', auth.authParticipant, async(req,res)=>{
    
    try{
        unregister = await ParticipantModel.participantUnregisterInEvent(req.participantID,req.params.id)
       if(unregister == null)
        res.status(202).send()
    
    else
        if(unregister.includes("ER_NO_REFERENCED"))
        res.status(406).send()
    
    else{
        if(unregister.includes("ER_DUP_ENTRY"))
        res.status(409).send()
    }
}
    catch(e){     
         res.status(500).send()
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