const express = require('express')
var mysql = require('mysql');
const router = new express.Router()
const connection = require('../models/db')
const OrganizerModel = require('../models/Organizer')
const auth = require('../middleware/auth')
const  multer = require('multer');
const { authOrganizer } = require('../middleware/auth');


// fix the routres small letters

const uploads = multer({
    limits: {
    fileSize: 16000000,
    },

})
   
//first picture is the proof second is profile
//image stored in the req.files[0].Buffer


router.post('/organizers/login',async (req,res)=>{

   try{ 
    
    const token = await OrganizerModel.login(req.body)
    
    if (token != null)
        res.status(202).send(token)
    else if (token == null)
            res.sendStatus(404)
}
    catch(e){
        res.sendStatus(500)
    }
}),

 router.post('/organizers/signup/partial',async (req,res) =>{
   try{
        const organizer = await OrganizerModel.organizerPartialSignup(req.body)
        if(organizer == null){
                res.status(200).send([])
        }
        else{
            res.status(201).send(organizer)
        }
    }
    catch(e){
        res.sendStatus(500)
    }

}),

router.get('/organizers/profile/type',auth.authOrganizer ,async (req,res) =>{
    try{
        const type = OrganizerModel.getOrganizerType(req.authOrganizerInfo)
        if (type == undefined)
            res.send(404)
    else{
        res.status(202).send(type)
    }
 }
 catch(e){
     res.sendStatus(500)
 }
}),



router.get('/organizers/profile', auth.authOrganizer,async (req,res) =>{
    try{
        const organizer = await OrganizerModel.getOrganizerInfo(req.authOrganizerInfo)   
        if(organizer != null){
            res.status(202).send(organizer)    
        }
        else{
            res.sendStatus(404)
        }
    }
    catch(e){
        res.sendStatus(500)
    }
}),





router.post('/organizers/signup/:type',uploads.array('image',2), async(req,res)=>{
    try{
        const organizer =  JSON.parse(req.body.organizer)
        organizerResult= await OrganizerModel.createOrganizer(organizer,req.files,req.params.type);
        if(organizerResult == undefined){
            res.sendStatus(201)
        }
        else{
        if(organizerResult.includes("ER_DUP_ENTRY")){
            res.sendStatus(409)
        } 
        }
    }
    catch(e){
        res.sendStatus(500)
    }    
   
})

router.get('/organizers/followers',auth.authOrganizer,async (req,res)=>{
    try{
    const followers = await OrganizerModel.getOrganizerFollowers(req.authOrganizerInfo.id)
        if(followers!=null){
            res.status(202).send(followers)
        }
        else{
            res.send(404)
    }
    }
    catch(e){
        res.send(500)
    }

 })

 router.patch('/organizers/updateEmail', auth.authOrganizer, async(req, res) => {
    try{
      const result = await OrganizerModel.updateOrganizerEmail(req.authOrganizerInfo, req.body)
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

router.patch('/organizers/changePassword', auth.authOrganizer, async(req,res) => {
    try{
      const result = await OrganizerModel.changeOrganizerPassword(req.authOrganizerInfo.id, req.body)
      if (result == null) res.send(200)
      else if (result == 403) res.send(403)
      else if (result == 406) res.send(406)
      else res.send(500)
    }
    catch(e){
        res.send(500)
    }
})

router.patch('/organizers/editProfile', auth.authOrganizer,uploads.single('image'), async(req,res)=>{
    try{
        const organizer =  JSON.parse(req.body.organizer)
        let image = undefined
        if (req.file) image = req.file.buffer
        console.log(organizer)
        const result = await OrganizerModel.editOrganizerProfile(req.authOrganizerInfo, organizer, image, req.body.flag)
        if (result.success) res.status(200).send(result.token)
        else if (result == 409)res.send(409)
        else res.send(500)
    }
    catch(e){
        console.log(e)
        res.send(500)
    }
})




module.exports = router