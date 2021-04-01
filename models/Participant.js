const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const organizer = require('../models/Organizer');
const auth = require('../middleware/auth');

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
    createParticipant: async( participant ) => {
      used = 0
      emailCheck = await makeDBQuery("select email from participant where email =?",participant.email)
      if( emailCheck.length !=0 ) {
        used = 1
        return used
      }  
      else{ 
      hashed = bcrypt.hashSync(participant.password, 8)
      participantDetails = [participant.firstName,participant.lastName,participant.email,hashed,participant.rating,participant.city]
      await makeDBQuery("INSERT INTO participant (firstName,lastName,email,password,rating,city) values (?,?,?,?,?,?)",participantDetails)
      const email = [participant.email] 
      participantID = await makeDBQuery("select id from participant where email = ?",email)
      
      numberOfCategories = participant.categories.length
      for(i=0;i<numberOfCategories;i++){
        participantCategoriesData = [participantID[0].id,participant.categories[i]]
        result = await makeDBQuery("INSERT INTO preferredcategory(participantID, category) VALUES (?,?)",participantCategoriesData )
        }
      }
      },

partialSignup: async (email) =>{
  emailInput =[email]
  result = await makeDBQuery("select email from participant where email =?",emailInput)
 
 
},


login:async (credentials)=>{ 
  console.log(credentials)
    participantInfo =  [credentials[0]] 
    const result = await makeDBQuery("Select id,firstName,lastName,email, password,city  from participant where Email =?", participantInfo )
   
    if(result.length == 0){
      return null
    }
    const isMatch = await bcrypt.compare(credentials[1],result[0].password)
    if(!isMatch){
      return null
      }
    else{    
      return auth.createParticipantToken(result[0])
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