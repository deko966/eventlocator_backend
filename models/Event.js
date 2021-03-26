const sql = require('./db.js');

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
  //sessions will have an array of objects
  //locatedEventData
  createEvent: async ( eventInfo ,authOrganizerInfo,image) => {
      const eventgeneralDetails = [ eventInfo.name, eventInfo.description, eventInfo.startDate, 
      eventInfo.endDate, eventInfo.registrationCloseDateTime,eventInfo.maxParticipants,
      eventInfo.whatsAppLink,eventInfo.status,authOrganizerInfo.id,image.buffer] 

      await makeDBQuery("INSERT INTO event(name,description,startDate, endDate, registrationCloseDateTime,maxParticipants, whatsappLink, status,organizerID,picture) VALUES  (?,?,?,?,?,?,?,?,?,?)" 
      ,eventgeneralDetails)
      
      organizerID =[authOrganizerInfo.id]
      const result = await makeDBQuery("select event.id from event join organizer on event.organizerID = organizer.id where event.organizerid =?",organizerID)
      
      if(eventInfo.locatedEventData != undefined){
       const  eventlocation = [result[0].id,eventInfo.locatedEventData.city,eventInfo.locatedEventData.location[0],eventInfo.locatedEventData.location[1]]
        await makeDBQuery("insert into locatedevent (eventID,city,longtitude,latitude) values (?,?,?,?) ",eventlocation)
  
      }

      if(eventInfo.sessions!= undefined){
        numberOfSessions = eventInfo.sessions.length;
        for(i= 0; i<numberOfSessions;i++){
        const sessionData = [result[0].id,eventInfo.sessions[i].id,eventInfo.sessions[i].date,
        eventInfo.sessions[i].startTime,eventInfo.sessions[i].endTime,eventInfo.sessions[i].dayOfWeek]
        await makeDBQuery("insert into session (eventID,id,date,startTime,endTime,dayOfWeek) values (?,?,?,?,?,?)",sessionData)
      }
    }     
    const eventID = result[0].id
   
    for(i = 0; i<eventInfo.categories.length; i++){

    eventCategoriesData = [eventID, eventInfo.categories[i]]
    await makeDBQuery("insert into eventcategories(eventID,category) values (?,?)",eventCategoriesData )
    
  }
    if(eventInfo.maxParticipants!=-1 && eventInfo.locatedEventData !=undefined){
    const limitedLocatedSessionData =[result[0].id,eventInfo.sessions.id,eventInfo.sessions.checkInTime]
    await makeDBQuery("insert into limitedlocatedsession (eventID,sessionID,checkInTime) values (?,?,?) ",limitedLocatedSessionData)
   
  }
},
//need to check how to get to pictures for each event and convert,will check this tmrw morning 

  getOrganizerEvents:async (organizerData) => {
    organizerID = [organizerData.id]
    let session={}
    const result = await makeDBQuery("SELECT event.id ,event.name,event.description,convert(event.startDate,Char) as startDate,convert(event.endDate,char) as endDate,convert(event.registrationCloseDatetime,char) as registrationCloseDatetime ,event.maxParticipants,event.rating, event.whatsAppLink,event.status from event where event.status <> 2 and event.organizerid =?"
    ,organizerID)
    
    event_session ={
      result
      
    }
    console.log(event_session)
    for(i=0; i < result.length; i++)
    {
     session[i] = await makeDBQuery("select session.id,convert(session.date,char) as date,session.startTime,session.endTime,session.dayOfWeek from event,session where event.status <> 2 and event.id =?"
    ,result[i].id)
   
    
    
    }
    console.log(event_session)
    
    if (result.length ==0 )
    return null
    else{
      return result
    }
  },


  getEventDetailsByID: async (eventData) => {
    eventID = [eventData]

    const result = await makeDBQuery("SELECT id, name, description, picture,CONVERT(StartDate, char) as startDate, CONVERT(EndDate,char)as endDate, CONVERT(registrationCloseDateTime,char) as registrationCloseDateTime , maxParticipants, status, rating, whatsAppLink, organizerID FROM event where event.ID =?",  
    eventID)

    const sessions = await makeDBQuery("select session.id,convert(session.date,char) as date,session.startTime,session.endTime,session.dayOfWeek from event,session where event.status <> 2 and event.id =?"
    ,eventID)    
 
    if(result.length == 0 ){
    return null
    }
    else{
      return {
        name:result[0].name,
        description:result[0].description,
        picture:Buffer.from(result[0].picture.buffer).toString('base64'),
        startDate:result[0].startDate,
        endDate:result[0].endDate,
        registrationCloseDateTime:result[0].registrationCloseDateTime,
        maxParticipants:result[0].maxParticipants,
        rating:result[0].rating,
        whatsAppLink:result[0].whatsAppLink,
        status:result[0].status,
        sessions:sessions
      }
    }
  },
  
    
    
    canceledEvent: async (eventData,eventID) => {
      cancelData = [eventID,eventData.data[0],eventData.data[1]]
      await makeDBQuery("insert into canceledevent (eventid,canceldatetime,cancelationreason) values(?,?,?)",cancelData)
    },

   
    getParticipantsOfAnEvent: async (eventID) => {
      const result = await makeDBQuery("select participant.id,participant.firstname,participant.lastname,participant.rating from participant join participantsregisterinevent on participantsregisterinevent.participantID = participant.id where participantsregisterinevent.EventID =? "
      ,eventID)
      if(result.length == 0){
        return null
        }        
      else{
        return result 
      }
    },
    getEventsFeedback:async (eventData) => {
      eventID=[eventData]
      const result = await makeDBQuery ("select feedback,rating from  participantsrateevent where participantsrateevent.eventid =?",eventID)
      if(result == null){
        return null
      }
      return result
    },
    
    

// ParticipantRegisterEvent:(event) =>{
//     eventID = event.id
//     await makeDBQuery("insert participant.FirstName,participant.LastName FROM participant  JOIN participantregisterinevent  ON participant.ID = participantregisterinevent.participantID   AND participantregisterinevent.eventID = ?"
//     ,eventID);
//     },



}