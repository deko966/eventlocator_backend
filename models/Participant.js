const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const organizer = require('../models/Organizer');

function makeDBQuery(query, arguments) {
  return new Promise((resolve, reject) => {
      sql.query(query, arguments, (err, result) => {
              if (err) {
                  return reject(err);
              }

              return resolve(result);
          }
      )
  })
}





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

login:async (participant)=>{ 
    participantInfo =  [participant.credentials[0]] 
    const result = await makeDBQuery("Select firstName,lastName,Email,city from participant where Email =? AND Password =?", participantInfo )
    
    if(result.length == 0){
      return null
    }
    const isMatch = await bcrypt.compare(participant.credentials[1],result[0].password)
    if(!ismatch){
      return null
      }
    else{    
      return createParticipantToken(result[0])
    }
    },

    FollowOrganizer:(organizerID,particpantID)=>{
        return new Promise(resolve => {
          input =  [organizerID,particpantID]
          sql.query("Insert into participantfolloworganizer values (?,?)" , input ,  (err, result)=> 
          {
          if (err) {
            resolve({undefined,err})
              }
              else{
           resolve({result, undefined})
            }
        }
        ) 
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
    getOrganizer:(organizerName)=>{
        return new Promise(resolve =>{
        input = [organizerName]
        sql.query("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where Name = ?", input ,  (err, result)=>{
              
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