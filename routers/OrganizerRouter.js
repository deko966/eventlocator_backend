const express = require('express')
var mysql = require('mysql');
const router = new express.Router()
const connection = require('../models/db')
const OrganizerModel = require('../models/Organizer')
const auth = require('../middleware/auth')
const  multer = require('multer');


// fix the routres small letters

const uploads = multer({
    limits: {
    fileSize: 16000000,
    },

})
   
//first picture is the proof second is profile
//image stored in the req.files[0].Buffer

router.post('/organizers/signup/:type',uploads.array('image',2), async(req,res)=>{
        
       try{ 
           console.log(req.files)
            const organizer =  JSON.parse(req.body.organizer)
            await OrganizerModel.createOrganizer(organizer,req.files,req.params.type);
            res.sendStatus(201);
       }
       catch(e){
           console.log(e)
           res.sendStatus(503)
       }
        
})

router.post('/organizer/login',async (req,res)=>{

    const token = await OrganizerModel.login(req.body)
    try{
    if (token != null)
        res.status(202).send(token)
    
      
    }  
    catch(e){
        console.log(e)
        res.status(404).send('unable to login')
    }
 }),

 router.post('/organizers/signup/partial',async (req,res) =>{
   
    const organizer = await OrganizerModel.organizerPartialSignup(req.body)
    if(organizer == null){
        res.sendStatus(200)
    }
    else{
        res.sendStatus(409)
    }

}),

router.get('/organizers/profile/type',auth.authOrganizer ,async (req,res) =>{
const type = await OrganizerModel.getOrganizerType(req.authOrganizerInfo)

 if (type == undefined)
    res.status(404).send("user not found")
else{
    res.status(202).send(type)
}
}),



router.get('/organizers/profile', auth.authOrganizer,async (req,res) =>{
    try{
    const organizer = await OrganizerModel.getOrganizerInfo(req.authOrganizerInfo)   
    res.status(202).send(organizer) 
    }
    catch(e){
        res.sendStatus(401)
    }
}),

router.get('/followers/:id',auth.authOrganizer,async (req,res)=>{
    const followers = await OrganizerModule.organizerFollower(req.params.id)
    try{
        res.status(202).send(followers)
    }
    catch(e){

        res.status(500).send(e)
    }

 })
,




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


module.exports = router