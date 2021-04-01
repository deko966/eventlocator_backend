const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const admin = require('../models/Admin')
const organizer = require('../models/Organizer')
const participant= require('../models/Participant')
 module.exports = {
    createAdminToken:(admin)=>{
    const token = jwt.sign({id:admin.ID.toString(),password:admin.Password.toString()},config.secret)
},
authAdmin:(req,res,next)=>{
    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret, (err, decoded) =>{
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        else
        next()
      });
},
createOrganizerToken: (organizer)=>{
    const token =  jwt.sign({id: organizer.id.toString(), email: organizer.email.toString(),
    phoneNumber: organizer.phoneNumber.toString(),Type:organizer.type.toString() } ,config.secret)
    return token

},

authOrganizer:(req,res,next)=>{
    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret, (err, decoded)=> {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        req.authOrganizerInfo= {id:decoded.id,type:decoded.Type}
        next()
      });
},
createParticipantToken:(participant)=>{
    const token = jwt.sign({id:participant.id.toString(),
    email:participant.email.toString()},config.secret)
    return token
},
authParticipant:(req,res,next)=>{
    console.log(req)
    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret,(err, decoded)=> {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    req.participantID=decoded.id
    console.log(decoded)
    next()
      });
},




}
 