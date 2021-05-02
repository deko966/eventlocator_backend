const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');


module.exports = {
    createAdminToken:(admin,res,req) => {
            const token = jwt.sign({
                id:admin.loginID,
                password:admin.password,
            },
            config.adminSecret
        )
    
        return token  
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
authAdmin:(req,res,next) => {
    if(!req.cookies.Authorization){   
        res.sendStatus(401)
        return -1
    }
    
    const token = req.cookies.Authorization.replace('Bearer ', '')
    jwt.verify(token, config.adminSecret,(err, decoded)=> {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        req.participantID=decoded.id

        next()
    });
},



}
 