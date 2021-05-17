const express = require('express')
const router =  express.Router()
const connection = require('../models/db')
const ParticipantModel = require('../models/Participant')
const auth = require('../middleware/auth')



router.post('/participants/signup',async (req,res)=>{
    console.log("Here1")
    try{
        const participant = await ParticipantModel.createParticipant(req.body)
        console.log(participant)
        if(participant==undefined)
            res.send(201)
        else if(participant.exists){
            res.status(409)
        }
        else {
            res.status(500)
        }
    } 
    catch(e){
        res.status(500)

    }
})


router.post('/participants/signup/partial',async (req,res)=>{
    
    try{
    const participant = await ParticipantModel.partialSignup(req.body)
      
    if(participant== null){
        res.status(200).send()
    }

    else
        if (participant.exists){
            res.status(409)
        
        }
    
    else
        res.status(500)
    
}
    catch(e){
        res.status(500)
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
        res.status(500)
    }
    
})


router.post('/participants/login',async (req,res)=>{
  
    try{ 
        const token = await ParticipantModel.login(req.body)
        if (token == 1) res.send(403)
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


router.post('/participants/follow/organizer/:id',auth.authParticipant,async (req,res)=>{
    try{
    const follow = await ParticipantModel.followOrganizer(req.params.id,req.participantID)
   if(follow == null)
    res.status(200)
    
    else{
        if(follow.includes("ER_DUP_ENTRY"))
            res.status(409)
        else{
            if(follow.includes("ER_NO_REFERENCED"))
                res.status(406)
        else{
            res.status(500)
        }
        }
    }
}
    catch(e){
        res.status(500)
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
         res.status(500).send(e)
     }
 })
 

router.post('/participants/unfollow/organizer/:id',auth.authParticipant,async (req,res)=>{
    try{
        const follow = await ParticipantModel.unfollowOrganizer(req.params.id,req.participantID)
        if(follow == null)
            res.status(200)
        else{
            if(follow.includes("ER_DUP_ENTRY"))
                res.status(409)
            else{
                if(follow.includes("ER_NO_REFERENCED"))
                    res.status(406)
                    else{
                        res.status(500)
                    }
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
          res.status(404)
      }
    }
    catch(e){
        res.status(500)
    }
})

router.get('/participant/information', auth.authParticipant, async(req,res) =>{
   try{
        const participant = await ParticipantModel.getParticipantByID(req.participantID)
        if (participant.suspended){
            res.send(403)
        }
        else if(participant!=undefined)
            res.status(202).send(participant)
        else res.send(404)
    }
    catch(e){
        res.status(500).send()
    }
    

})

router.post('/participants/event/:id/register', auth.authParticipant, async(req,res)=>{
    try{
        const registration = await ParticipantModel.participantRegisterInEvent(req.participantID,req.params.id, req.body[0])
        if (registration == undefined) res.send(202)
        else if (registration.conflict) res.send(403)
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
        unregister = await ParticipantModel.participantUnregisterInEvent(req.participantID,req.params.id, req.body[0])
       if(unregister == null)
        res.send(202)
    
        else
            if(unregister.includes("ER_NO_REFERENCED"))
            res.send(406)
        
        else if(unregister.includes("ER_DUP_ENTRY")){
            res.send(409)
        }
        else{
            res.send(500)
        }
    }
    catch(e){     
         res.send(500)
     }
  })  


  router.patch('/participants/updateEmail', auth.authParticipant, async(req, res) => {
      try{
        const result = await ParticipantModel.updateParticipantEmail(req.participantID, req.body)
        if (result.success) res.status(200).send(result.token)
        else if (result == 403) res.send(403)
        else if (result == 406) res.send(406)
        else if (result == 409) res.send(409)
        else res.send(500)
      }
      catch(e){
          res.send(500)
      }
  })

  router.patch('/participants/changePassword', auth.authParticipant, async(req,res) => {
      try{
        const result = await ParticipantModel.changeParticipantPassword(req.participantID, req.body)
        if (result == null) res.send(200)
        else if (result == 403) res.send(403)
        else if (result == 406) res.send(406)
        else res.send(500)
      }
      catch(e){
          res.send(500)
      }
  })

  router.patch('/participants/editCityAndCategories', auth.authParticipant, async(req,res) => {
      try{
        const result = await ParticipantModel.editParticipantCityAndCategories(req.participantID, req.body)
        if (result == null) res.send(200)
        else res.send(500)
      }
      catch(e){
        res.send(500)
      }
  })

module.exports = router