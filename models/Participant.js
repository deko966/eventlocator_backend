const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const organizer = require('../models/Organizer');
const auth = require('../middleware/auth');
const ratingUtils = require('../utils/ratingUtils');

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

// function getOrganizerUtil(participantID){

// const organizers = await makeDBQuery("select id, name, rating from participantsfolloworganizer join organizer on organizer.id =participantsfolloworganizer.organizerID and participantsfolloworganizer.ParticipantID = ?" ,participantID)
//   for(let i=0;i<organizers.length;i++){
//   organizerID = [organizers[i].id]
//   const tempResult = await makeDBQuery("select Count(participantID) as followers from participantsfolloworganizer where organizerID = ?",organizerID)
//   let noOfFollowers = 0
//     if(tempResult[0].followers!= undefined)
//       noOfFollowers=tempResult[0].followers

//   result.push({
//       id:organizers[i].id, 
//       name: organizers[i].name,
//       email: "",
//       about: "",
//       rating: organizers[i].rating,
//       socialMediaAccounts: "",
//       upcomingEvents: "",
//       previousEvents:"",
//       canceledEvents:"",
//       image: "",
//       numberOfFollowers: noOfFollowers,
//       isFollowedByCurrentParticipant: true,
      
//   })
//   }
//   return result 
// },




module.exports = {

  createParticipant: async( participant ) => {
  
   try{ 
     emailCheck = await makeDBQuery("select email from participant where email =?",participant.email)
   }
   catch(e){
     return e.message
   }
      hashed = bcrypt.hashSync(participant.password, 8)
      participantDetails = [participant.firstName,participant.lastName,participant.email,hashed,participant.rating,participant.city]
      try{
      await makeDBQuery("INSERT INTO participant (firstName,lastName,email,password,rating,city) values (?,?,?,?,?,?)",participantDetails)
      }
      catch(e){
        return e.message
      }
      const email = [participant.email] 
      try{
      participantID = await makeDBQuery("select id from participant where email = ?",email)
      }
      catch(e){
        return e.message
      }
      const categoriesToInsert = []
      numberOfCategories = participant.preferredEventCategories.length
      for(let i=0;i<numberOfCategories;i++){
        categoriesToInsert.push([participantID[0].id,participant.preferredEventCategories[i]])
      }
      try{
        result = await makeDBQuery("INSERT INTO participantpreferredeventcategories(participantID, category) VALUES (?)",categoriesToInsert )
      }
      catch(e){
        return e.message
      }
  },




partialSignup: async (email) =>{
  emailInput =[email]
  
  result = await makeDBQuery("select email from participant where email =?",emailInput)
  
  return result[0]
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




followOrganizer:async (organizerID,participantID)=>{

  registrationIDs =  [participantID,organizerID]
  try{
  await makeDBQuery("Insert into participantsfolloworganizer(participantID,organizerID) values (?,?)",registrationIDs) 
  }
  catch(e){
    return e.message
  }
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
    let followedResult = await makeDBQuery("select organizerID ,participantID from participantsfolloworganizer where organizerID =? and participantID = ?",bothIDs )
    let result = []
    let followed = false

    if(followedResult.length>0)
    followed = true
    const type = await makeDBQuery("Select type from organizer where organizer.ID =?",organizersID)
  
    
    if(type[0].type == 0){
      const organizationResult = await makeDBQuery("select organizer.id,IFNULL(count( participantsfolloworganizer.participantID),0) as followers,organization.logo as image , name, email, description, phoneNumber, rating, facebookName,facebookLink,youTubeName,youTubeLink,instagramName,instagramLink,twitterName,twitterLink FROM organizer JOIN organization ON organizer.id=organization.OrganizerID join participantsfolloworganizer on participantsfolloworganizer.OrganizerID=organizer.id where organizer.id =?"
      ,organizersID)
    
     
      if( organizationResult == undefined ){
        return null
      }
      else{
        result.push({
          id:organizationResult[0].id,
          name: organizationResult[0].name,
          email:organizationResult[0].email,
          about:organizationResult[0].description,
          rating:organizationResult[0].rating,
          socialMediaAccounts:[
            {accountName:organizationResult[0].facebookName,url:organizationResult[0].facebookLink},
            {accountName:organizationResult[0].youTubeName,url:organizationResult[0].youTubeLink},
            {accountName:organizationResult[0].instagramName,url:organizationResult[0].instagramLink},
            {accountName:organizationResult[0].twitterName,url:organizationResult[0].twitterLink}
          ],
          numberOfFollowers:organizationResult[0].followers,
          image:Buffer.from(organizationResult[0].image.buffer).toString('base64'),
          isFollowedByCurrentParticipant:followed
        })
        return result[0]
      }
}
      if (type[0].type == 1 ){
        const individualResult = await makeDBQuery("SELECT IFNULL(count( participantsfolloworganizer.participantID),0) as followers,individual2.profilePicture ,organizer.id, name, email, description, phoneNumber, rating, facebookName,facebookLink,instagramName,instagramLink,twitterName,twitterLink,youTubeName,youTubeLink, linkedInName, linkedInLink FROM organizer JOIN individual2 ON organizer.id=individual2.OrganizerID join participantsfolloworganizer on individual2.OrganizerID = participantsfolloworganizer.OrganizerID where organizer.id =?"
        ,organizerID)

    if (individualResult == undefined)
        return null
      
      else{
        let pic = ""
        if (individualResult[0].profilePicture != null) pic = Buffer.from(result[0].profilePicture.buffer).toString('base64')
        result.push({
          id:individualResult[0].id,
          name: individualResult[0].name,
          email:individualResult[0].email,
          about:individualResult[0].description,
          rating:individualResult[0].rating,
          socialMediaAccounts:[
            {accountName:individualResult[0].facebookName,url:individualResult[0].facebookLink},
            {accountName:individualResult[0].youTubeName,url:individualResult[0].youTubeLink},
            {accountName:individualResult[0].instagramName,url:individualResult[0].instagramLink},
            {accountName:individualResult[0].twitterName,url:individualResult[0].twitterLink},
            {accountName:individualResult[0].linkedInName,url:individualResult[0].linkedInLink}
          ],
          image:pic,
          numberOfFollowers:individualResult[0].followers,
          isFollowedByCurrentParticipant:followed
        })
        return result[0]
      }
    }     
},

    
getParticipantByID:async (participantID) =>{
  const result = []
  participantsID = [participantID] 
  const participant = await makeDBQuery("SELECT id, firstName, lastName, email,city, rating FROM participant where  id =?",participantsID)
  const categoriesResult  = await makeDBQuery("select category from  participantpreferredeventcategories where participantID= ?",participantsID)
  const categories = []

  for(k = 0; k < categoriesResult.length; k++)
  categories.push(categoriesResult[k].category)

  result.push({
    id:participant[0].id,
    firstName:participant[0].firstName,
    lastName:participant[0].lastName,
    email:participant[0].email,
    city:participant[0].city,
    rating:participant[0].rating,
    preferredEventCategories:categories
  })

  return result[0]
} ,  

participantRegisterInEvent: async (participantID,eventID) => {
  let eventsID = [eventID]
  let registrationIDs = [eventID,participantID]
  let eventinfo = await makeDBQuery("select maxParticipants, endDate from event where ID = ?",eventsID)
  let lastSessionEndTime = await makeDBQuery("SELECT endTime from session WHERE eventID = ? AND id = (SELECT MAX(id) FROM session WHERE eventID = ?)", [eventID, eventID])
  lastSessionEndTime = lastSessionEndTime[0].endTime
  let locatedEventData = await makeDBQuery("SELECT city from locatedevent WHERE eventID = ? ", eventID)
  if(eventinfo[0].maxParticipants == -1){
    try{
    await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
    if (locatedEventData.length > 0 && eventinfo[0].maxParticipants > -1){
      const finishDateTime = Date.parse(eventInfo.endDate +'T'+lastSessionEndTime)
      const now = Date.now()
      setTimeout(() => {
        await ratingUtils.alterParticipantRatingAfterLimitedLocatedEvent(participantID,eventID)
      }, finishDateTime - now)
    }
    }
    catch(e){
      return e.message
    }
  }
  else{
    let eventParticipants = await makeDBQuery("select Count(eventID) as total from participantsregisterinevent where eventID =?",eventID)
    if(eventParticipants[0].total < eventinfo[0].maxParticipants){
      try{
      await makeDBQuery("insert into participantsregisterinevent(eventID,participantID) values (?,?)",registrationIDs)
      }
      catch(e)
      {
        return e.message
      }
    }
    else{
      return -1 
    }
  }
  },


//  need to add number of regisetred organizer to check if possible
participantUnregisterInEvent: async (participantID,eventID) =>{
  registrationIDs = [participantID,eventID]
  try{
  await makeDBQuery("delete from  participantsregisterinevent where participantID = ? and eventID = ?",registrationIDs)
  }
  catch(e){
    return e.message
  }
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
      socialMediaAccounts: [],
      image: "",
      numberOfFollowers: noOfFollowers,
      isFollowedByCurrentParticipant: true,
  })
  }
  return result 
},


getAllOrganizers: async ()=>{
  let result = []
  const organizers = await makeDBQuery("SELECT id, name, rating FROM organizer WHERE 1")
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
        socialMediaAccounts: [],
        image: "",
        numberOfFollowers: noOfFollowers,
        isFollowedByCurrentParticipant: true,
        
    })
    }
    return result 
}
}

