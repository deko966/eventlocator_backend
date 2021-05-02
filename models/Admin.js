const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const auth = require('../middleware/auth')


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
    signup:async(credential)=>{
      
        hashed = await bcrypt.hashSync(credential.password, 8)
        credentials =[credential.loginID,hashed]
        await makeDBQuery("insert into admin ( loginID,password) values (?,?)",credentials)

    },
    login: async(credentials)=>{
        adminID = credentials.username
    
        adminResult = await makeDBQuery("select loginID,password from admin where loginID = ?",adminID)
       
        if(adminResult.length == 0){
            return null
        }
        const isMatch = await bcrypt.compare(credentials.password,adminResult[0].password)
       
        if(!isMatch){
            return null
        }

        return auth.createAdminToken(adminResult[0])
    },
    getallpendingInfo: async() =>{
        
        accountStatus = 0;
        eventStatus = 0;
        Oresult = await makeDBQuery("select id,name, email,phoneNumber,type from organizer where accountStatus = ?",accountStatus)
        Eresult = await makeDBQuery("select id, name,startDate,endDate from event where status =?",eventStatus )
        const result = [Oresult,Eresult]
        return result;
    },
     getPendingOrganizerInfo: async(organizerID)=>{
        pendingOrganizerID = organizerID
        const result = await makeDBQuery("SELECT id, name, email, description, proofImage, phoneNumber, facebookName, facebookLink, instagramName, instagramLink, twitterName, twitterLink, youTubeName, youTubeLink, type FROM organizer WHERE id =?",pendingOrganizerID)
        const img = result[0].proofImage.toString('base64')
        result[0].proofImage=img
        return result
        
     },

    getPendingEventInfo: async(eventID) =>{
        pendingEventID = eventID
        const result = await makeDBQuery("select ID, name, description, picture as logo, startDate, endDate, registrationCloseDateTime, maxParticipants, WhatsappLink, OrganizerID from event where id =?",pendingEventID)
        const img = result[0].logo.toString('base64')
        result[0].logo = img
        return result
    }
}