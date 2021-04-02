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

FollowOrganizer:async (organizerID,particpantID)=>{
      
    const inputDetails =  [organizerID,particpantID]
    await makeDBQuery("Insert into participantfolloworganizer values (?,?)",inputDetails) 
},

unfollowOrganizer:async (organizer)=>{
    
    organizerID = organizer.id
    await makeDBQuery("delete  from participantsfolloworganizer(organizerID,participantID) where organizerID = ? and participantID=? ",organizerID)
        
},

getOrganizer:async (organizerName)=>{
     
    input = [organizerName]
    await makeDBQuery("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where Name = ?", input)    
}, 
participantRegisterInEvent: async (participantID,eventID) => {
    registrationIDs = [participantID,eventID]
    await makeDBQuery("insert into participantregisterinevent(participantID,organizerID) values (?,?)",registrationIDs)
},
participantUnregisterInEvent: async (participantID,eventID) =>{
  registrationIDs = [participantID,eventID]
  await makeDBQuery("delete from  participantregisterinevent where participantID = ? and eventID = ?",registrationIDs)
},

organizerFollowedByParticipant: async (participantID) =>{
  const noOfFollowers=0;
  let result=[]
  const organizer = await makeDBQuery("select id, name, rating from participantsfolloworganizer join organizer on organizer.id =participantsfolloworganizer.organizerID where participantsfolloworganizer.ParticipantID =?" ,participantID)
  organizerID =[organizer[0].id]
  const followers = await makeDBQuery("select Count(participantID) as followers from participantsfolloworganizer where organzierID = ?",organizerID)
 if(followers!=undefined)
  noOfFollowers=followers[0].followers 

  if(organizer!= undefined)
  result.push({
      id:organizer[0].id, 
      name: organizer[0].name,
      email: "",
      about: "",
      rating: organizer[0].rating,
      socialMediaAccounts: "",
      upcomingEvents: "",
      previousEvents:"",
      canceledEvents:"",
      image: "",
      numberOfFollowers: noOfFollowers,
      isFollowedByCurrentParticipant: true,
      
  })

  


}

}
