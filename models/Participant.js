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




followOrganizer:async (organizerID,particpantID)=>{
      console.log(organizerID,particpantID)
  const inputDetails =  [2,114]
  const result =  await makeDBQuery("Insert into participantsfolloworganizer(participantID,organizerID) values (?,?)",inputDetails) 
  console.log(result)

},  



unfollowOrganizer:async (organizerID,participantID)=>{
    
    registrationIDs = [organizerID,participantID]
    await makeDBQuery("delete  from participantsfolloworganizer where organizerID = ? and participantID=? ",registrationIDs)
        
},


getOrganizer:async (organizerName)=>{
    input = [organizerName]
    await makeDBQuery("Select Name,Email,Description,PhoneNumber,FacebookName,FacebookLink,InstagramName,InstagramLink,TwitterName,TwitterLink,YouTubeName,YouTubeLink from organizer where Name = ?", input)    
}, 



participantRegisterInEvent: async (participantID,eventID) => {
  registrationIDs = [eventID,participantID]
    await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
},



participantUnregisterInEvent: async (participantID,eventID) =>{
  registrationIDs = [participantID,eventID]
  await makeDBQuery("delete from  participantsregisterinevent where participantID = ? and eventID = ?",registrationIDs)
},


//i failed at this one

getOrganizersFollowedByParticipant: async (participantID) =>{
  
  const result=[]
  const organizers = await makeDBQuery("select id, name, rating from participantsfolloworganizer join organizer on organizer.id =participantsfolloworganizer.organizerID and participantsfolloworganizer.ParticipantID = ?" ,participantID)
  for(let i=0;i<organizers.length;i++){
  organizerID = [organizers[i].id]
  const tempResult = await makeDBQuery("select Count(participantID) as followers from participantsfolloworganizer where organizerID = ?",organizerID)
  let noOfFollowers = 0
    if(tempResult[0].followers!= undefined)
      noOfFollowers=tempResult[0].followers

  result.push({
      id:organizers[i].id, 
      name: organizers[i].name,
      email: "",
      about: "",
      rating: organizers[i].rating,
      socialMediaAccounts: "",
      upcomingEvents: "",
      previousEvents:"",
      canceledEvents:"",
      image: "",
      numberOfFollowers: noOfFollowers,
      isFollowedByCurrentParticipant: true,
      
  })
  }
  return result 
}
}
