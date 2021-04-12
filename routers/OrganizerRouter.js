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
        else
        if (token == null)
            res.sendStatus(404)
}
    catch(e){
        res.sendStatus(500)
    }
}),

 router.post('/organizers/partial/sign',async (req,res) =>{
   const conflict = []
   
        const organizer = await OrganizerModel.organizerPartialSignup(req.body)
        if(organizer == null){
            res.sendStatus(200)
    }
    else{
       for(i=0;i<organizer.length;i++){
           if(organizer[i]!=null)
           conflict.push(organizer[i])
       }
       res.status(409).send(conflict)
    }

}),

router.get('/organizers/profile/type',auth.authOrganizer ,async (req,res) =>{
const type = await OrganizerModel.getOrganizerType(req.authOrganizerInfo)

 try{
     if (type == undefined)
        res.status(404).send("user not found")
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
   
}
    catch(e){
    
        res.sendStatus(500)
    }
}),



router.patch('/modifyOrganizerProfile',async (req,res)=>{

 })
 //this might be divided into 3 statments 
// router.get('/OrganizerInfo',(req,res)=>{
//     connection.query('SELECT * FROM `Organizer`',  (error, results, fields)=> {
//         res.send(results)  
//     });
//       })

router.patch('/modifyRating',auth.authOrganizer,async (req,res)=>{
    const rating = await OrganizerModel.alterRating(req.body)
    if (rating.err)
    res.status(500).send(rating.err)
    else
    res.status(200).send("success")
})



router.post('/organizers/signup/:type',uploads.array('image',2), async(req,res)=>{
    try{
        const organizer =  JSON.parse(req.body.organizer)
        organizerResult= await OrganizerModel.createOrganizer(organizer,req.files,req.params.type);
        console.log(organizerResult)
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

router.get('/followers/:id',auth.authOrganizer,async (req,res)=>{
    try{
    const followers = await OrganizerModel.organizerFollower(req.params.id)
        if(followers!=null){
        res.status(202).send(followers)
        }
        else{
            res.sendStatus(404)
    }
    }
    catch(e){
        res.sendStatus(500)
    }

 }),




module.exports = router