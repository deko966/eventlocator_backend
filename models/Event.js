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
      eventInfo.whatsappLink,eventInfo.eventStatus,authOrganizerInfo.id,image.buffer] 

      await makeDBQuery("INSERT INTO event(name,description,startDate, endDate, registrationCloseDateTime,maxParticipants, whatsappLink, eventStatus,organizerID,picture) VALUES  (?,?,?,?,?,?,?,?,?,?)" 
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
        const sessionData = [result[0].id,eventInfo.sessions[i].id,eventInfo.sessions[i].sessionDate,
        eventInfo.sessions[i].startTime,eventInfo.sessions[i].endTime,eventInfo.sessions[i].dayOfWeek]
        await makeDBQuery("insert into session (eventID,id,sessionDate,startTime,endTime,dayOfWeek) values (?,?,?,?,?,?)",sessionData)
      }
    }     
    
    const eventCatgeoriesData =[result[0].id, eventInfo.eventCategories]
    await makeDBQuery("insert into eventcategories(eventID,eventcategory) values (?,?)",eventCatgeoriesData )

    if(eventInfo.maxParticipants!=-1 && eventInfo.locatedEventData !=undefined){
    const limitedLocatedSessionData =[result[0].id,eventInfo.sessions.id,eventInfo.sessions.checkInTime]
    await makeDBQuery("insert into limitedlocatedsession (eventID,sessionID,checkInTime) values (?,?,?) ",limitedLocatedSessionData)
   
  }
},
//need to check how to get to pictures for each event and convert,will check this tmrw morning 

  getOrganizerEvents:async (organizerData) => {
    organizerID = [organizerData.id]
    const result = await makeDBQuery("select event.name,event.description,event.picture,event.numberofparticipants,event.startdate,event.enddate,event.registrationclosedatetime,event.maxparticipants,event.rating ,event.whatsapplink,event.eventstatus from event join organizer on event.organizerid =organizer.id  where organizer.id = ? and eventstatus <> 2"
    ,organizerID)
    
    
    if (result.length ==0 )
    return null
    else{
      return result
    }
      


  },

  getEventDetailsByID: async (eventData) => {
    eventID = [eventData]

    const result = await makeDBQuery("select name,description,picture,numberofparticipants,startdate,enddate,registrationclosedatetime,maxparticipants,rating whatsapplink,eventstatus from event where eventstatus <> 2 and event.id =?"
   ,eventID)

    if(result.length == 0 ){
    return null
    }
    else{
      return result 
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


getEventDetails: async ( event ) =>{   
  eventID = event.id
  await makeDBQuery("SELECT id, name, description, numberOfParticipants, startDate, endDate, registrationCloseDateTime, eventStatus, whatsappLink from event where ID = ?" 
  ,eventID)
  
  },   
}

