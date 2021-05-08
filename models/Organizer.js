const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const auth = require('../middleware/auth');
const { createOrganizerToken, authOrganizer } = require('../middleware/auth');
const ratingUtils = require('../utils/ratingUtils.js');
//auth we store the ID and phone number and email and password
//auth we store the ID email and password for participant 
//need to add status for organizer here

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
    createOrganizer: async (organizer,images, type) => {
      hashed = await bcrypt.hashSync(organizer.password, 8)
      emailInput = [organizer.email]
      generalInput = [organizer.name,organizer.email,hashed, organizer.about,
          organizer.phoneNumber,organizer.socialMediaAccounts[0].accountName,
          organizer.socialMediaAccounts[0].url, organizer.socialMediaAccounts[1].accountName,
          organizer.socialMediaAccounts[1].url, organizer.socialMediaAccounts[2].accountName,
          organizer.socialMediaAccounts[2].url, organizer.socialMediaAccounts[3].accountName, organizer.socialMediaAccounts[3].url,type,images[0].buffer]
      if (type == 0) {
          try{
            await makeDBQuery("INSERT INTO organizer (Name,Email,Password,Description,PhoneNumber,FacebookName,FacebookLink,YouTubeName,YouTubeLink,InstagramName,InstagramLink,TwitterName,TwitterLink,Type,proofimage) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", generalInput);
          }
          catch(e){

            return e.message
          }
            const organizerID= await makeDBQuery('select ID from organizer where email =?', emailInput);
          
          
          organizationInput = [organizerID[0].ID,images[1].buffer]
          try{
          await makeDBQuery("INSERT INTO organization (organizerID,Logo) values (?,?)", organizationInput);
          }
          catch(e){
            return e.message
          }
        }
  
      if (type == 1) {
        try{  
          await makeDBQuery("INSERT INTO organizer (Name,Email,Password,Description,PhoneNumber,FacebookName,FacebookLink,YouTubeName,YouTubeLink,InstagramName,InstagramLink,TwitterName,TwitterLink,Type,proofImage) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
          ,generalInput);
        }
        catch(e){
          return e.message
        }
          if(images[1]==undefined){
           checkedImage=images[1]=null
          }
          if(images[1]!=null){
            checkedImage=images[1].buffer
          }       
          const organizerID = await makeDBQuery ('select id from organizer where email =?',emailInput)
          indiviudalInput = [organizerID[0].id,checkedImage,organizer.socialMediaAccounts[4].accountName,organizer.socialMediaAccounts[4].url]
         try{
          await makeDBQuery("INSERT INTO individual2 (OrganizerID,profilepicture,LinkedInName,LinkedInLink) values (?,?,?,?)" , indiviudalInput);
         }
         catch(e){
          return e.message
         }
        }
      },
      //need to add 3 sql functions
  organizerPartialSignup: async (partialInfo) =>{
    result=[]
    let nameResult=null
    let  emailResult =null
    let phoneNumberResult=null
    organizerEmail = [partialInfo[0]]
    organizerName = [partialInfo[1]]
    organizerPhone = [partialInfo[2]]
    emailResult = await makeDBQuery ("select email from organizer where email =?"
    ,organizerEmail)
    
    nameResult = await makeDBQuery ("select name from organizer where name =?"
    ,organizerName)
    phoneNumberResult = await makeDBQuery ("select phoneNumber from organizer where phoneNumber =?"
    ,organizerPhone)

    if (emailResult.length == 0 && nameResult.length == 0  && phoneNumberResult.length == 0 ){
      return null
    }
    if(emailResult.length>0){
      result.push(0)
    }
    if(nameResult.length>0){
      result.push(1)
    }
    if(phoneNumberResult.length>0){
      result.push(2)
    }
    return result
  
  },



//retrive most basic info
login: async(credentials)=>{

    organizerInfo = [credentials[0]]
    const result = await makeDBQuery("Select id,email,password,phoneNumber,type, accountStatus from organizer where Email =? ", organizerInfo)
    
    if(result.length == 0){
      return null
    }
    else if (result[0].accountStatus != 1){
      return result[0].accountStatus.toString()
    }
    const isMatch = await bcrypt.compare(credentials[1],result[0].password)
    if(!isMatch){
      return null
      }
    else{    
      return auth.createOrganizerToken(result[0])
    }
},



getOrganizerFollowers:async (organizerID)=>{
    const result = []
    const participants = await makeDBQuery("SELECT CONCAT(participant.FirstName,' ',participant.LastName) as fullName FROM participant  JOIN participantsfolloworganizer  ON participant.ID = participantsfolloworganizer.participantID AND participantsFollowOrganizer.organizerID = ?" 
    ,organizerID)
    if (participants.length==0){
      return null
    }
    for(let i =0;i<participants.length;i++){
      result.push(participants[i].fullName)
    }
    return result

},

getOrganizerInfo: async (organizerAuthInfo) => {
    organizerID = [organizerAuthInfo.id]
    //join first with the organizer type then with the followers table
    if (organizerAuthInfo.type == 0){
     const result = await makeDBQuery("select organizer.id,IFNULL(count( participantsfolloworganizer.ParticipantID),0) as followers,organization.logo as image , name, email, description, phoneNumber, facebookName,facebookLink,youTubeName,youTubeLink,instagramName,instagramLink,twitterName,twitterLink FROM organizer JOIN organization ON organizer.id=organization.OrganizerID join participantsfolloworganizer on participantsfolloworganizer.OrganizerID = Organizer.ID where organizer.id =?"
       ,organizerID)
      const isSuspended = await makeDBQuery("SELECT accountStatus FROM organizer WHERE id = ?", organizerID)
      if(isSuspended[0].accountStatus == 3){
        return {suspended: true}
      }
      if(result.length == 0) {
        return null
      }
    else {
      const rating = await ratingUtils.getOrganizerRating(organizerID)
      return organization = {
        numberOfFollowers: result[0].followers,
        name: result[0].name,
        email:result[0].email,
        about:result[0].description,
        phoneNumber:result[0].phoneNumber,
        status: 1,
        rating: rating,
        socialMediaAccounts:[
        {accountName:result[0].facebookName,url:result[0].facebookLink},
        {accountName:result[0].youTubeName,url:result[0].youTubeLink},
        {accountName:result[0].instagramName,url:result[0].instagramLink},
        {accountName:result[0].twitterName,url:result[0].twitterLink}],
        image:Buffer.from(result[0].image.buffer).toString('base64')
      }
    }      
  }
    
    if(organizerAuthInfo.type == 1){
     
      const result = await makeDBQuery("SELECT IFNULL(count( participantsfolloworganizer.participantID),0) as followers,individual2.profilePicture , name, email, description, phoneNumber, facebookName,facebookLink,instagramName,instagramLink,twitterName,twitterLink,youTubeName,youTubeLink, linkedInName, linkedInLink FROM organizer JOIN individual2 ON organizer.id=individual2.OrganizerID join participantsfolloworganizer on individual2.OrganizerID = participantsfolloworganizer.OrganizerID where organizer.id =?"
      ,organizerID) 
      const isSuspended = await makeDBQuery("SELECT accountStatus FROM organizer WHERE id = ?", organizerID)
      if(isSuspended[0].accountStatus == 3){
        return {suspended: true}
      }
      if(result.length == 0) {
        return null
      }
    
      else{
        let image = ""
        if (result[0].profilePicture != null) image = Buffer.from(result[0].profilePicture.buffer).toString('base64')
          const rating = await ratingUtils.getOrganizerRating(organizerID)
          return indiviudalInfo= {
            numberOfFollowers: result[0].followers,
            name: result[0].name,
            email:result[0].email,
            about:result[0].description,
            phoneNumber:result[0].phoneNumber,
            status: 1,
            image:image,
            rating: rating,
            socialMediaAccounts:[
            {accountName:result[0].facebookName,url:result[0].facebookLink},
            {accountName:result[0].youTubeName,url:result[0].youTubeLink},
            {accountName:result[0].instagramName,url:result[0].instagramLink},
            {accountName:result[0].twitterName,url:result[0].twitterLink},
            {accountName:result[0].linkedInName,url:result[0].linkedInLink}
          ]}
        }
    }
},


getOrganizerType: (organizerAuthInfo) =>{
  return organizerAuthInfo.type
},

updateOrganizerEmail: async(organizerInfo, data) => {
  try{
    const password = await makeDBQuery("SELECT password FROM Organizer WHERE id = ?", organizerInfo.id)
    const isMatch = await bcrypt.compare(data[1], password[0].password)
    if (!isMatch) return 403
    const email = await makeDBQuery("SELECT email FROM organizer WHERE id <> ? AND email = ?",[organizerInfo.id,data[0]])
    if (email.length>0) return 409
    const sameEmail = await makeDBQuery("SELECT email FROM organizer WHERE id = ? AND email = ?", [organizerInfo.id,data[0]])
    if (sameEmail.length == 1)return 406
    await makeDBQuery("UPDATE organizer SET email = ? WHERE id = ?", [data[0],organizerInfo.id])
    const newToken = auth.createOrganizerToken({id:organizerInfo.id, email: data[0], type: organizerInfo.type, phoneNumber: organizerInfo.phoneNumber })
    return {success:true, token:newToken}
  }
  catch(e){
    return e.message
  }
},

changeOrganizerPassword: async(organizerID, data) => {
  try{
    const password = await makeDBQuery("SELECT password FROM organizer WHERE id = ?", organizerID)
    const isMatch = await bcrypt.compare(data[0],password[0].password)
    if (!isMatch) return 403
    const isNewMatch = await bcrypt.compare(data[1], password[0].password)
    if (isNewMatch) return 406
    const hashedPassword = bcrypt.hashSync(data[1], 8)
    await makeDBQuery("UPDATE organizer set password = ? WHERE id = ?", [hashedPassword, organizerID])
    return null

  }
  catch(e){
    console.log(e)
    return e.message
  }
},

editOrganizerProfile: async(organizerInfo, organizer, image, flag) =>{
  try{
    const phoneExists = await makeDBQuery("SELECT phoneNumber FROM organizer WHERE id <> ? AND phoneNumber = ?", [organizerInfo.id, organizer.phoneNumber])
    if (phoneExists.length>0) return 409
    const input = [organizer.about, organizer.phoneNumber, 
      organizer.socialMediaAccounts[0].accountName, organizer.socialMediaAccounts[0].url,
      organizer.socialMediaAccounts[1].accountName, organizer.socialMediaAccounts[1].url,
      organizer.socialMediaAccounts[2].accountName, organizer.socialMediaAccounts[2].url,
      organizer.socialMediaAccounts[3].accountName, organizer.socialMediaAccounts[3].url, organizerInfo.id]
    await makeDBQuery("UPDATE organizer SET description = ?, phoneNumber = ?, facebookName = ?, facebookLink = ?, youtubeName = ?, youtubeLink = ?, instagramName = ?, instagramLink = ?, twitterName = ?, twitterLink = ? WHERE id = ?", input)

    if (organizerInfo.type == 0 && image!=undefined){
      await makeDBQuery("UPDATE organization SET logo = ? WHERE organizerID = ?", [image,organizerInfo.id])
    }
    else if (organizerInfo.type == 1){
      await makeDBQuery("UPDATE individual2 SET linkedInName = ?, linkedInLink = ? WHERE organizerID = ?", [organizer.socialMediaAccounts[4].accountName, organizer.socialMediaAccounts[4].url,organizerInfo.id])
      if (flag != 1){
        await makeDBQuery("UPDATE individual2 SET ProfilePicture = ? WHERE organizerID = ?",[image, organizerInfo.id])
      }
    }
    const newToken = auth.createOrganizerToken({id:organizerInfo.id, type:organizerInfo.type, email: organizerInfo.email, phoneNumber: organizer.phoneNumber})
    return {success:true, token: newToken}
  }
  catch(e){
    console.log(e)
    return e.message
  }
}
 

}
