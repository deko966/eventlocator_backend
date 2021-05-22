const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');
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
    signup:async(credential)=>{
      
        hashed = await bcrypt.hashSync(credential.password, 8)
        credentials =[credential.loginID,hashed]
        await makeDBQuery("insert into admin (loginID,password) values (?,?)",credentials)

    },
    login: async(credentials)=>{
        adminID = credentials.username
    
        adminResult = await makeDBQuery("select loginID,password from admin where loginID = ?",adminID)
       
        if(adminResult.length == 0){
            return -1
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
        organizerResult = await makeDBQuery("select id,name, email,phoneNumber,type from organizer where accountStatus = ?",accountStatus)
        eventResult = await makeDBQuery("select id, name,startDate,endDate from event where status =?",eventStatus )
        const result = [organizerResult,eventResult]
        return result;
    },
     getPendingOrganizerInfo: async(organizerID)=>{
        pendingOrganizerID = organizerID
        const result = await makeDBQuery("SELECT id, name, email, description, proofImage, phoneNumber, facebookName, facebookLink, instagramName, instagramLink, twitterName, twitterLink, youTubeName, youTubeLink, type FROM organizer WHERE id =?",pendingOrganizerID)

        const proofImg = result[0].proofImage.toString('base64')
        result[0].proofImage=proofImg
        

        if(result[0].type == 0){
            const logoResult = await makeDBQuery("select logo from organization where organizerid =?",pendingOrganizerID) 
            const logo = logoResult[0].logo.toString('base64')
            result[0].logo=logo 
            result[0].type ="organization"
            
        }
        else{
            result[0].type="individual"
            const profilePictureResult = await makeDBQuery("select profilePicture from individual2 where organizerid=?",pendingOrganizerID) 
           if(profilePictureResult[0].profilePicture==undefined)
           {
            return result
           }
           else{
            const profilePicture = profilePictureResult[0].profilePicture.toString('base64')
            result[0].profilePicture = profilePicture
           }
        }

        return result
        
     },

    getPendingEventInfo: async(eventID) =>{

        let result = []       
        let cities = ["Amman","Al-Zarqa","Al-Balqa","Madaba","Irbid","Al-Mafraq","Jerash","Ajloun","Al-Karak","Al-Aqaba","Ma\`an","Al-Tafila"]
        let categoryName = ["Educational", "entertainment", "volunteering", "sports"]
        toDisplay = []
        const pendingEventID = eventID
        const eventResult = await makeDBQuery("select ID, name, description, picture as logo, DATE_FORMAT(startDate,'%a/%d/%m/%Y') as startDate, DATE_FORMAT(endDate,' %a/%d/%m/%Y') as endDate, registrationCloseDateTime, maxParticipants, whatsappLink, organizerID from event where id =?",pendingEventID)
        let organizerID = eventResult[0].organizerID
        console.log(eventResult[0].whatsappLink+ "here1")
        if (eventResult[0].whatsappLink == null)
            eventResult[0].whatsappLink=""

     
       const organizerResult= await makeDBQuery("select name ,email, phoneNumber from organizer where id =? ",organizerID)
        const img = eventResult[0].logo.toString('base64')
        eventResult[0].logo = img
        let sessions = await makeDBQuery("select id,DATE_FORMAT(session.date,'%d/%m/%Y') as date,startTime,endTime,dayOfWeek from session where eventid = ? ORDER BY id ASC",eventID)


        const categoriesResult = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
        const categories = []
        for(let k = 0; k < categoriesResult.length; k++)
        categories.push(categoriesResult[k].category)
        for (i = 0; i < categories.length; i++)
        {
            toDisplay+= categoryName[categories[i]] + ','
        }

 
        const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
        if(locatedEventDataResult.length>0){
        let cityName = cities[locatedEventDataResult[0].city]
        locatedEventDataResult[0].city = cityName
        }
        if (eventResult[0].maxParticipants > 0 && locatedEventDataResult.length >0){
        let limitedLocatedSessionData = await makeDBQuery("SELECT checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", eventID)
        for(j =0; j< sessions.length; j++){
            sessions[j].checkInTime = limitedLocatedSessionData[j].checkInTime
        }
        }
        else{
        for(j =0; j< sessions.length; j++){
            sessions[j].checkInTime = ""
      }
    }
        if(eventResult[0].maxParticipants =-1){
            eventResult[0].maxParticipants="No limit"
        }


        result = [eventResult,organizerResult,sessions,toDisplay,locatedEventDataResult]
        return result
    },


    setResponseOrganizer:async(organizerID,adminID,response)=>{
        let status = 0
        if(response == 0)
         status = parseInt(response)+1
        else{
            status = parseInt(response) +1
        }
        const today = new Date();

        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        
        const  dateTime = date+'T'+time;
        const acceptedinfo=[status,response,dateTime,adminID,organizerID]
        await makeDBQuery("update organizer set accountstatus=? ,response = ? ,responseDateTime = ?, adminid=? where id =? ",acceptedinfo)
    },
    
    setResponseEvent:async(eventId,adminID,response)=>{
        let status = 0
     
        if(response == 0){
         status = parseInt(response)+1
        }
        else{
            status = parseInt(response) + 1
        }
        const today = new Date();

        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        
        const  dateTime = date+'T'+time;
        const acceptedinfo=[status,response,dateTime,adminID,eventId]
        await makeDBQuery("update event set status=?,response = ? ,responseDateTime = ?, adminid=? where id =? ",acceptedinfo)
  
    },

}