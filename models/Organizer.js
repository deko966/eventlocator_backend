const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
//auth we store the ID and phone number and email and password
//might delete password for organizer
//auth we store the ID email and password for participant 

module.exports = {
    createOrganizer: ( organizer ) => {
      return new Promise(resolve => {
        hashed = bcrypt.hashSync(organizer.Password, 8)
        input = [organizer.Name,organizer.Email,hashed,organizer.Description,organizer.ProofImage,organizer.PhoneNumber,organizer.FacebookName,organizer.FacebookLink,organizer.InstagramName,
          organizer.InstagramLink,organizer.TwitterName,organizer.TwitterLink,
          organizer.YouTubeName,organizer.YouTubeLink]
        sql.query("INSERT INTO organizer (Name,Email,Password,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink) values (?,?,?,?,?,?,?,?,?,?,?,?,?)" 
        ,input,  (err, result)=> {
            if (err) {
          resolve({undefined,err})
            }
            else{
         resolve({result, undefined})
          }
        });
    })
    },


//retrive most basic info
login:(organizer)=>{
     return new Promise(resolve => {
        hashed = bcrypt.hashSync(organizer.Password, 8)
        input = [ organizer.Email,hashed]
        sql.query("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where Email =? AND Password =?", input ,  (err, result)=> 
        {
          console.log(result)
        if (err) {
          resolve({undefined,err})
            }
            else{
         resolve({result, undefined})
          }
      });
    })
    },

organizerFollower:(organizer)=>{
  return new Promise(resolve => {
    input =  organizer.id
    sql.query("SELECT participant.FirstName,participant.LastName FROM participant  JOIN participantfolloworganizer  ON participant.ID = participantfolloworganizer.participantID   AND participantFollowOrganizer.organizerID = ?" , input ,  (err, result)=> 
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
alterRating:(organizer)=>{
  return new Promise(resolve => {
    input =  [organizer.Rating,organizer.ID]
    sql.query("UPDATE organizer SET rating = ? where ID  = ?" , input ,  (err, result)=> 
    {
    if (err) {
      resolve({undefined,err})
        }
        else{
     resolve({result, undefined})
      }
  });
})  
} 

}
