const express = require('express')
var mysql = require('mysql');
const router = new express.Router()
const connection = require('../models/db')
const OrganizerModule = require('../models/Organizer')
const auth = require('../middleware/auth')
var multer = require('multer');

// fix the routres small letters

const upload = multer({
    limits: {
        fileSize: 16000000
    },
}).array('image', 2)



router.post('/createOrganizer',upload, async(req,res)=>{
    console.log(req.files)
    console.log(JSON.parse(req.body.organizer))
    // const organizer = await OrganizerModule.createOrganizer(req.body)
    // if(organizer.err)
    //     res.status(500).send(organizer.err)
    // else{

    //     res.status(200).send(organizer)
    // }
    
    res.sendStatus(200)

})

router.post('/organizerLogin',async (req,res)=>{

    const organizer = await OrganizerModule.login(req.body)
    if(organizer.err)
    res.status(500).send(organizer.err)
    else{
       const token = await auth.createOrganizerToken(req.body)
        res.status(200).send(token)
    }


})

router.get('/Followers/:id',auth.authOrganizer,async (req,res)=>{
    const followers = await OrganizerModule.organizerFollower(req.params.id)
    if(followers.err)
    res.status(500).send(followers.err)
    else{

        res.status(200).send(followers)
    }
 })




router.patch('/ModifyOrganizerProfile',async (req,res)=>{

 })
 //this might be divided into 3 statments 
// router.get('/OrganizerInfo',(req,res)=>{
//     connection.query('SELECT * FROM `Organizer`',  (error, results, fields)=> {
//         res.send(results)  
//     });
//       })

router.patch('/ModifyRating',auth.authOrganizer,async (req,res)=>{
    const rating = await OrganizerModule.alterRating(req.body)
    if (rating.err)
    res.status(500).send(rating.err)
    else
    res.status(200).send("success")
})

module.exports = router