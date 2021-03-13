const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const organizer = require('../models/Organizer');





module.exports = {
    createParticipant:( participant ) => {
      return new Promise (resolve =>  {
        hashed = bcrypt.hashSync(participant.Password, 8)
        input = [participant.FirstName,participant.LastName,participant.Email,hashed,participant.City]
        sql.query("INSERT INTO participant (firstName,lastName,Email,Password,city) values (?,?,?,?,?)",input,  (err, result)=> {
            if (err) {
          resolve({undefined,err})
            }
            else{
         resolve({result, undefined})
          }
        });
    })
    },

    login:(participant)=>{
        return new Promise(resolve => {
          
          hashed = bcrypt.hashSync(participant.Password, 8)
          input = [ participant.Email,hashed]
          sql.query("Select firstName,lastName,Email,city from participant where Email =? AND Password =?", input ,  (err, result)=> 
           {
           
           if (err) {
             resolve({undefined,err})
               }
               else{
            resolve({result, undefined})
             }
         });
       })
       },

    FollowOrganizer:(organizer)=>{
        return new Promise(resolve => {
          input =  organizer.id
          sql.query("insert into participantsfolloworganizer (participantID) where organizerID = ?" , input ,  (err, result)=> 
          {
          if (err) {
            resolve({undefined,err})
              }
              else{
           resolve({result, undefined})
            }
        });
      })
      },
    unfollowOrganizer:(organizer)=>{
        return new Promise(resolve =>{
        input = organizer.id
        sql.query("delete  from participantsfolloworganizer where organizerID = ? ", input ,  (err, result)=>{
          
        if (err) {
            resolve({undefined,err})
        }
        else{
           resolve({result, undefined})
        }
        });
        })
},
    getOrganizer:(organizer)=>{
        return new Promise(resolve =>{
        input = organizer.name
        sql.query("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where name = ?", input ,  (err, result)=>{
              
        if (err) {
            resolve({undefined,err})
        }
        else{
            resolve({result, undefined})
        }
        });
        })
    },
  
}  