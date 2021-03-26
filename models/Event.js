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
      const result = await makeDBQuery("select event.id from event join organizer on event.organizerID = organizer.id where event.organizerid =? order by event.id DESC",organizerID)
      console.log(eventInfo.locatedEventData)
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
    numberOfCategories = eventInfo.categories.length
   
    for(i = 0; i<numberOfCategories; i++){

    eventCategoriesData = [eventID, eventInfo.categories[i]]
    await makeDBQuery("insert into eventcategories(eventID,category) values (?,?)",eventCategoriesData )
    
  }

    if(eventInfo.maxParticipants!=-1 && eventInfo.locatedEventData !=undefined){

      for(i=0;i<numberOfSessions;i++){
        const limitedLocatedSessionData =[eventID,eventInfo.sessions[i].id,eventInfo.sessions[i].checkInTime]
        await makeDBQuery("insert into limitedlocatedsession (eventID,sessionID,checkInTime) values (?,?,?) ",limitedLocatedSessionData)
      }
  }
},
 

  getOrganizerEvents:async (organizerData) => {
    organizerID = [organizerData.id]
    const result = []
    const eventsResult = await makeDBQuery("SELECT event.id ,event.name,event.description,convert(event.startDate,Char) as startDate,convert(event.endDate,char) as endDate,convert(event.registrationCloseDatetime,char) as registrationCloseDatetime ,event.maxParticipants,event.rating, event.whatsAppLink,event.status from event where event.status <> 2 and event.organizerid =?"
    ,organizerID)

    for(i=0; i < eventsResult.length; i++)
    {
      const id = eventsResult[i].id
     let sessions = await makeDBQuery("select id,convert(date,char) as date,startTime,endTime,dayOfWeek from session where eventID =? ORDER BY id ASC",id)
      sessions = JSON.parse(JSON.stringify(sessions))

     const locatedEventDataResult = await makeDBQuery("SELECT city, longtitude, latitude FROM locatedevent WHERE EventID = ?", id)
    
      if (eventsResult[i].maxParticipants > 0 && locatedEventDataResult.length >0){
        let limitedLocatedSessionData = await makeDBQuery("SELECT checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", id)
        for(j =0; j< sessions.length; j++){
          sessions[j].checkInTime = limitedLocatedSessionData[i].checkInTime
        }
      }
      else{
        for(j =0; j< sessions.length; j++){
          sessions[j].checkInTime = ""
        }
      }

      const canceledEventDataResult = await makeDBQuery("SELECT cancelationReason, convert(cancelDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", id)
    
      const categoriesResult = await makeDBQuery("SELECT category from eventCategories WHERE EventID = ?", id)

      const categories = []
      for(k = 0; k < categoriesResult.length; k++)
      categories.push(categoriesResult[k].category)

      let locatedEventData= null
      let locations = []
      if (locatedEventDataResult.length>0){
        locations.push(locatedEventDataResult[0].latitude)
        locations.push(locatedEventDataResult[0].longtitude)
        locatedEventData = {
          city: locatedEventDataResult[0].city,
          location: locations
        }
      }

      let canceledEventData = null
      if (canceledEventDataResult.length > 0){
        canceledEventData = {
          cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
          cancellationReason: canceledEventDataResult[0].cancelationReason
        }
      }

      result.push(
        {
          id: eventsResult[i].id,
          name: eventsResult[i].name,
          description: eventsResult[i].description,
          categories: categories,
          startDate: eventsResult[i].startDate,
          endDate: eventsResult[i].endDate,
          registrationCloseDateTime: eventsResult[i].registrationCloseDatetime,
          status: eventsResult[i].status,
          maxParticipants: eventsResult[i].maxParticipants,
          rating: eventsResult[i].rating,
          sessions: sessions,
          participants: [],
          feedback: [],
          locatedEventData: locatedEventData,
          canceledEventData: canceledEventData,
          image: "",
          whatsAppLink: eventsResult[i].whatsAppLink
        }

    )

    
    }
    return result
  },


  getEventDetailsByID: async (eventID) => {
    const result = []
    const eventResult = await makeDBQuery("SELECT id, name, description, picture,CONVERT(StartDate, char) as startDate, CONVERT(EndDate,char)as endDate, CONVERT(registrationCloseDateTime,char) as registrationCloseDateTime , maxParticipants, status, rating, whatsAppLink, organizerID FROM event where event.ID =?",  
    eventID)

    let sessions = await makeDBQuery("select session.id,convert(session.date,char) as date,session.startTime,session.endTime,session.dayOfWeek from event,session where event.status <> 2 and event.id =?"
    ,eventID)
    sessions = JSON.parse(JSON.stringify(sessions))

    const categoriesResult = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
    const categories = []
    for(k = 0; k < categoriesResult.length; k++)
    categories.push(categoriesResult[k].category)
 
    const locatedEventDataResult = await makeDBQuery("SELECT city, longtitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
    


    if (eventResult[0].maxParticipants > 0 && locatedEventDataResult.length >0){
      let limitedLocatedSessionData = await makeDBQuery("SELECT checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", eventID)
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = limitedLocatedSessionData[i].checkInTime
      }
    }
    else{
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = ""
      }
    }

    const canceledEventDataResult = await makeDBQuery("SELECT cancelationReason, convert(cancelDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)
    
    let locatedEventData= null
    let locations = []
    if (locatedEventDataResult.length>0){
      locations.push(locatedEventDataResult[0].latitude)
      locations.push(locatedEventDataResult[0].longtitude)
      locatedEventData = {
        city: locatedEventDataResult[0].city,
        location: locations
      }
    }

    let canceledEventData = null
    if (canceledEventDataResult.length > 0){
      canceledEventData = {
        cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
        cancellationReason: canceledEventDataResult[0].cancelationReason
      }
    }

    if(eventResult.length == 0 ){
    return null
    }

       result.push({
        id: eventResult[0].id,
        name: eventResult[0].name,
        description: eventResult[0].description,
        categories: categories,
        startDate: eventResult[0].startDate,
        endDate: eventResult[0].endDate,
        registrationCloseDateTime: eventResult[0].registrationCloseDateTime,
        status: eventResult[0].status,
        maxParticipants: eventResult[0].maxParticipants,
        rating: eventResult[0].rating,
        sessions: sessions,
        participants: [],
        feedback: [],
        locatedEventData: locatedEventData,
        canceledEventData: canceledEventData,
        image: Buffer.from(eventResult[0].picture.buffer).toString('base64'),
        whatsAppLink: eventResult[0].whatsAppLink
      })
      return result[0]
    
  },
  
    
    
    canceledEvent: async (canceledEventData,eventID) => {
      cancelData = [eventID,canceledEventData.cancellationDateTime,canceledEventData.cancellationReason]
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
    getAttendaceOfAnEvent: async(eventID) =>{
      
      const attendees = await makeDBQuery()


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