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



//need to add handlefor status depending on what the status is return proper response
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




followOrganizer:async (organizerID,particpantID)=>{

  const inputDetails =  [particpantID,organizerID]
  const result =  await makeDBQuery("Insert into participantsfolloworganizer(participantID,organizerID) values (?,?)",inputDetails) 
  console.log(result)

},  



unfollowOrganizer:async (organizerID,participantID)=>{
    
    registrationIDs = [organizerID,participantID]
    await makeDBQuery("delete  from participantsfolloworganizer where organizerID = ? and participantID=? ",registrationIDs)
        
},


getOrganizerByName:async (organizerName)=>{
     
    input = [organizerName]
    await makeDBQuery("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where Name = ?", input)    
}, 

 getOrganizerByID:async (organizerID) =>{
    input = [organizerID]
    const type = await makeDBQuery("Select type from organizer where organizer.ID =?",input)
    if(type==0){
      await makeDBQuery("select id, name, email,description as about,rating,facebookName,facebookLink,youtubeName,youtubeLink,instagramName,instagramLink,twitterName,TwitterLink,logo from organizer,organization where organizer.id = ?"
      ,input)
}
},

    
   




participantRegisterInEvent: async (participantID,eventID) => {
  registrationIDs = [eventID,participantID]
    await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
},


//  need to add number of regisetred organizer to check if possible
participantUnregisterInEvent: async (participantID,eventID) =>{
  registrationIDs = [participantID,eventID]
  await makeDBQuery("delete from  participantsregisterinevent where participantID = ? and eventID = ?",registrationIDs)
},


//i failed at this one

getorganizerFollowedByParticipant: async (participantID) =>{
  
  let result=[]
  const organizer = await makeDBQuery("select id, name, rating from participantsfolloworganizer join organizer on organizer.id =participantsfolloworganizer.organizerID where participantsfolloworganizer.ParticipantID = ?" ,participantID)

  for(i=0;i<organizer.length;i++){
  organizerID = [organizer[i].id]
  const tempResult = await makeDBQuery("select Count(participantID) as followers from participantsfolloworganizer where organizerID = ?",organizerID)
  let noOfFollowers =0
    if(tempResult[0].followers!= undefined)
      noOfFollowers=tempResult[0].followers 
 }


  if(organizer!= undefined)
  for(i=0;i<organizer.length;i++){
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
      numberOfFollowers: noOfFollowers[i],
      isFollowedByCurrentParticipant: true,
      
  })
  }
  return result 
}
}
