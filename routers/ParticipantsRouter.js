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
            res.sendStatus(201)
        if(participant.includes("ER_DUP_ENTRY")){
            res.status(409)
        }
    } 
    catch(e){
        res.status(500)

    }
})


router.post('/participants/signup/partial',async (req,res)=>{
    
    try{
    const participant = await ParticipantModel.partialSignup(req.body)
      
    if(participant== undefined){
        res.sendStatus(200)
    }

    else{    
        res.status(409).send(null)
    }
    }
    catch(e){
        res.status(500).send(null)
    }
})


router.get('/participants/organizers/all', auth.authParticipant, async (req,res) =>{
    try{
        const organizers = await ParticipantModel.getAllOrganizers()
        if(organizers.length==0){
            res.status(404)
        }
        else{
            res.status(200).send(organizers)
        }
    }
    catch(e){
        res.sendStatus(500)
    }
    
})


router.post('/participants/login',async (req,res)=>{
  
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
    const follow = await ParticipantModel.followOrganizer(req.params.id,req.participantID)
   if(follow == null)
    res.sendStatus(200)
    
    else{
        if(follow.includes("ER_DUP_ENTRY"))
            res.sendStatus(409)
        else{
            if(follow.includes("ER_NO_REFERENCED"))
                res.sendStatus(406)
        }
    }
}
    catch(e){
        res.sendStatus(500)
    }

})

router.get('/participants/organizers/followed', auth.authParticipant, async(req,res)=>{
    try{
     const organizers = await ParticipantModel.getOrganizersFollowedByParticipant(req.participantID)
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
        const follow = await ParticipantModel.unfollowOrganizer(req.params.id,req.participantID)
        if(follow == null)
            res.sendStatus(200)
        else{
            if(follow.includes("ER_DUP_ENTRY"))
                res.sendStatus(409)
            else{
                if(follow.includes("ER_NO_REFERENCED"))
                    res.sendStatus(406)
            }
        }
    }
    catch(e){
        res.sendStatus(500)
    }

})

router.get('/participants/organizer/:id', auth.authParticipant, async(req,res)=>{
    try{
    const organizer = await ParticipantModel.getOrganizerByID(req.params.id,req.participantID)
    if(organizer!=undefined)
    res.status(202).send(organizer)
      else{
          res.sendStatus(404)
      }
    }
    catch(e){
        res.sendStatus(500)
    }
})

router.get('/participant/information', auth.authParticipant, async(req,res) =>{
   try{
    const participant = await ParticipantModel.getParticipantByID(req.participantID)
    if(participant!=undefined)
      res.status(202).send(participant)
      else{
          res.sendStatus(404)
      }
    }
    catch(e){
        res.sendStatus(500)
    }
    

})

router.post('/participants/event/:id/register', auth.authParticipant, async(req,res)=>{
    try{
        const registration = await ParticipantModel.participantRegisterInEvent(req.participantID,req.params.id)
        if (registration == undefined) res.send(202)
        else if(registration == -1|| registration.includes("ER_DUP_ENTRY"))
            res.send(409)
        else if(registration.includes("ER_NO_REFERENCED")){
            res.send(406)
        }
        else{
            res.status(500)
        }

    }
    catch(e){
        res.send(500)
    }
  })

  router.post('/participants/event/:id/unregister', auth.authParticipant, async(req,res)=>{
    
    try{
        unregister = await ParticipantModel.participantUnregisterInEvent(req.participantID,req.params.id)
       if(unregister == null)
        res.send(202)
    
        else
            if(unregister.includes("ER_NO_REFERENCED"))
            res.send(406)
        
        else{
            if(unregister.includes("ER_DUP_ENTRY"))
            res.send(409)
        }
    }
    catch(e){     
         res.send(500)
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