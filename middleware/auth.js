const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
 module.exports = {
    createAdminToken:(admin)=>{
    const token = jwt.sign({id:admin.ID.toString(),password:admin.Password.toString()},config.secret)
},
authAdmin:(req,res,next)=>{
    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret, (err, decoded) =>{
        if (err) return res.send(401);
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
    if(!req.headers.authorization)  {
        res.send(401)
        return -1
    }

    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret, (err, decoded)=> {
        if (err){ 
            return res.send(401);
        }
        
        req.authOrganizerInfo= {id:decoded.id,type:decoded.Type, email: decoded.email, phoneNumber: decoded.phoneNumber}
        next()
      });
},

createParticipantToken:(participant)=>{
    const token = jwt.sign({id:participant.id.toString(),
    email:participant.email.toString()},config.secret)
    return token
},
authParticipant:(req,res,next)=>{
    if(!req.headers.authorization)  
    {   res.send(401)
        return -1
    }
    const token = req.header('Authorization').replace('Bearer ', '')
    jwt.verify(token, config.secret,(err, decoded)=> {
    if (err) return res.send(401)
    req.participantID=decoded.id
    next()
      });
},




}
 