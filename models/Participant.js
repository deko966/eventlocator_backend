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
      console.log("here")
      hashed = bcrypt.hashSync(participant.password, 8)
      participantDetails = [participant.firstName,participant.lastName,participant.email,hashed,participant.rating,participant.city]
      await makeDBQuery("INSERT INTO participant (firstName,lastName,email,password,rating,city) values (?,?,?,?,?,?)",participantDetails)
      const email = [participant.email] 
      participantID = await makeDBQuery("select id from participant where email = ?",email)
      
      const categoriesToInsert = []
      numberOfCategories = participant.preferredEventCategories.length
      for(let i=0;i<numberOfCategories;i++){
        categoriesToInsert.push([participantID[0].id,participant.preferredEventCategories[i]])
      }
        result = await makeDBQuery("INSERT INTO participantpreferredeventcategories(participantID, category) VALUES (?)",categoriesToInsert )
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

 getOrganizerByID:async (organizerID,participantID) =>{
    const organizersID = [organizerID]
    const bothIDs = [organizerID,participantID]
    let result=[]
    let followed = await makeDBQuery("select organizerID ,participantID from participantsfolloworganizer where organizerID =? and participantID = ?",bothIDs )
  
   
    if (followed.length==0)
      {
        followed = 0
      }

    else
      {
        followed = 1
      }
    
    const type = await makeDBQuery("Select type from organizer where organizer.ID =?",organizersID)
  
    
    if(type[0].type == 0){
      const organizationResult = await makeDBQuery("select organizer.id,IFNULL(count( participantsfolloworganizer.participantID),0) as followers,organization.logo as image , name, email, description, phoneNumber, rating, facebookName,facebookLink,youTubeName,youTubeLink,instagramName,instagramLink,twitterName,twitterLink FROM organizer JOIN organization ON organizer.id=organization.OrganizerID join participantsfolloworganizer on participantsfolloworganizer.OrganizerID=organizer.id where organizer.id =?"
      ,organizersID)
    
     
      if( organizationResult == undefined ){
        return null
      }
      else{
        console.log(followed)
        result.push({
          id:organizationResult[0].id,
          name: organizationResult[0].name,
          email:organizationResult[0].email,
          about:organizationResult[0].about,
          rating:organizationResult[0].rating,
          socialMediaAccounts:[
            {accountName:organizationResult[0].facebookName,url:organizationResult[0].facebookLink},
            {accountName:organizationResult[0].youTubeName,url:organizationResult[0].youTubeLink},
            {accountName:organizationResult[0].instagramName,url:organizationResult[0].instagramLink},
            {accountName:organizationResult[0].twitterName,url:organizationResult[0].twitterLink}
          ],
          noOfFollowers:organizationResult[0].followers,
          image:Buffer.from(organizationResult[0].image.buffer).toString('base64'),
          isFollowedByCurrentParticipant:followed
        })
        return result
      }
}
      if (type[0].type == 1 ){
        const individualResult = await makeDBQuery("SELECT IFNULL(count( participantsfolloworganizer.participantID),0) as followers,individual2.profilePicture ,organizer.id name, email, description, phoneNumber, rating, facebookName,facebookLink,instagramName,instagramLink,twitterName,twitterLink,youTubeName,youTubeLink, linkedInName, linkedInLink FROM organizer JOIN individual2 ON organizer.id=individual2.OrganizerID join participantsfolloworganizer on individual2.OrganizerID = participantsfolloworganizer.OrganizerID where organizer.id =?"
        ,organizerID)

    if (individualResult == undefined)
        return null
      
      else{
        let pic = ""
        if (result[0].profilePicture != null) pic = Buffer.from(result[0].profilePicture.buffer).toString('base64')
        result.push({
          id:individualResult[0].id,
          name: individualResult[0].name,
          email:individualResult[0].email,
          about:individualResult[0].about,
          rating:individualResult[0].rating,
          socialMediaAccounts:[
            {accountName:individualResult[0].facebookName,url:individualResult[0].facebookLink},
            {accountName:individualResult[0].youTubeName,url:individualResult[0].youTubeLink},
            {accountName:individualResult[0].instagramName,url:individualResult[0].instagramLink},
            {accountName:individualResult[0].twitterName,url:individualResult[0].twitterLink},
            {accountName:individualResult[0].linkedInName,url:individualResult[0].linkedInLink}
          ],
          image:pic,
          noOfFollowers:individualResult[0].followers,
          isFollowedByCurrentParticipant:followed
        })
        return result
      }
    }     
},

    
getParticipantByID:async (participantID) =>{
  participantsID = [participantID] 
  participant = await makeDBQuery("SELECT id, firstName, lastName, email, password, city, rating, ratingPenalty, accountStatus FROM participant where  id =?",participantsID)
  return participant
} ,  

participantRegisterInEvent: async (participantID,eventID) => {
  let eventsID = [eventID]
  let registrationIDs = [eventID,participantID]
  let eventinfo = await makeDBQuery("select maxParticipants from event where ID = ?",eventsID)

  if(eventinfo[0].maxParticipants == -1){
    await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
  }
  else{
    let eventParticipants = await makeDBQuery("select Count(eventID) as total from participantsregisterinevent where eventID =?",eventID)
    if(eventParticipants[0].total < eventinfo[0].maxParticipants){
      await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
    }
    else{
      return -1 
    }
  }
  },


//  need to add number of regisetred organizer to check if possible
participantUnregisterInEvent: async (participantID,eventID) =>{
  registrationIDs = [participantID,eventID]
  await makeDBQuery("delete from  participantsregisterinevent where participantID = ? and eventID = ?",registrationIDs)
},




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
