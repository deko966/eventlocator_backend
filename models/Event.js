const sql = require('./db.js');
const ratingUtils = require('../utils/ratingUtils')
const schedule = require('node-schedule')
const moment = require('moment-timezone')
const admin = require('../utils/firebaseAdmin')
const tokens = require('../utils/tokens');
const { response } = require('express');
const emailUtils = require('../utils/emailUtils.js');
const updateRatingMap = new Map()

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

const getOrganizerEventsUtil = async (organizerID) => {
  const result = []
  const eventsResult = await makeDBQuery("SELECT id, name, description,convert(startDate,Char) as startDate,convert(endDate,char) as endDate,convert(registrationCloseDatetime,char) as registrationCloseDatetime, maxParticipants, whatsAppLink, status FROM event WHERE status <> 2 and organizerid = ?"
  ,organizerID)
  for(i=0; i < eventsResult.length; i++)
  {
    const id = eventsResult[i].id
   let sessions = await makeDBQuery("select id,convert(date,char) as date,startTime,endTime,dayOfWeek from session where eventID =? ORDER BY id ASC",id)
    sessions = JSON.parse(JSON.stringify(sessions))
   const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", id)
  
    if (eventsResult[i].maxParticipants > 0 && locatedEventDataResult.length >0){
      let limitedLocatedSessionData = await makeDBQuery("SELECT sessionID, checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", id)
      limitedLocatedSessionData = JSON.parse(JSON.stringify(limitedLocatedSessionData))
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = limitedLocatedSessionData[j].checkInTime
      }
    }
    else{
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = ""
      }
    }

    const canceledEventDataResult = await makeDBQuery("SELECT cancellationReason, convert(cancellationDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", id)
  
    const categoriesResult = await makeDBQuery("SELECT category from eventCategories WHERE EventID = ?", id)

    const categories = []
    for(k = 0; k < categoriesResult.length; k++)
    categories.push(categoriesResult[k].category)

    let locatedEventData= null
    let locations = []
    if (locatedEventDataResult.length>0){
      locations.push(locatedEventDataResult[0].latitude)
      locations.push(locatedEventDataResult[0].longitude)
      locatedEventData = {
        city: locatedEventDataResult[0].city,
        location: locations
      }
    }

    let canceledEventData = null
    if (canceledEventDataResult.length > 0){
      canceledEventData = {
        cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
        cancellationReason: canceledEventDataResult[0].cancellationReason
      }
    }
    const rating = await ratingUtils.getEventRating(eventsResult[i].id)
    const numberOfParticipants = await makeDBQuery("SELECT COUNT(participantID) as currentNumberOfParticipants FROM participantsregisterinevent WHERE eventID = ? ", id)
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
        rating: rating,
        sessions: sessions,
        locatedEventData: locatedEventData,
        canceledEventData: canceledEventData,
        image: "",
        whatsAppLink: eventsResult[i].whatsAppLink,
        currentNumberOfParticipants: numberOfParticipants[0].currentNumberOfParticipants
      }
  )
  }
  return result
}

const prepareUpcomingEventsUtil = async (currentParticipantID,eventResult) => {
  const result = []
  for(let i = 0; i< eventResult.length; i++){
    const eventID = eventResult[i].id
    const registeredEvents = await makeDBQuery("SELECT EventID FROM participantsregisterinevent,event WHERE participantID = ? AND cast(concat(event.startDate, ' ',(SELECT startTime FROM session where ID = 1 AND eventID = event.id) ) as datetime) > NOW() and eventID = ?", [currentParticipantID,eventID])
    const numberOfParticipants = await makeDBQuery("SELECT COUNT(participantID) as currentNumberOfParticipants FROM participantsregisterinevent WHERE eventID = ? ", eventID)
    const isParticipantRegistered = registeredEvents.length > 0
    let sessions = await makeDBQuery("select id,convert(date,char) as date,startTime,endTime,dayOfWeek from session where eventID =? ORDER BY id ASC",eventID)
  sessions = JSON.parse(JSON.stringify(sessions))

 const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
  if (eventResult[i].maxParticipants > 0 && locatedEventDataResult.length >0){
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

  const canceledEventDataResult = await makeDBQuery("SELECT cancellationReason, convert(cancellationDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)

  const categoriesResult = await makeDBQuery("SELECT category from eventCategories WHERE EventID = ?", eventID)

  const categories = []
  for(k = 0; k < categoriesResult.length; k++){
  categories.push(categoriesResult[k].category)
  }
  let locatedEventData= null
  let locations = []
  if (locatedEventDataResult.length>0){
    locations.push(locatedEventDataResult[0].latitude)
    locations.push(locatedEventDataResult[0].longitude)
    locatedEventData = {
      city: locatedEventDataResult[0].city,
      location: locations
    }
  }

  let canceledEventData = null
  if (canceledEventDataResult.length > 0){
    canceledEventData = {
      cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
      cancellationReason: canceledEventDataResult[0].cancellationReason
    }
  }

  const rating = await ratingUtils.getEventRating(eventResult[i].id)

  result.push({
    id: eventResult[i].id,
    description: "",
    name: eventResult[i].name,
    categories: categories,
    startDate: eventResult[i].startDate,
    endDate: eventResult[i].endDate,
    registrationCloseDateTime: eventResult[i].registrationCloseDateTime,
    rating: rating,
    sessions: sessions,
    feedback: null,
    locatedEventData: locatedEventData,
    canceledEventData: canceledEventData,
    maxParticipants: eventResult[i].maxParticipants,
    image: "",
    organizerID: eventResult[i].organizerID,
    organizerName: eventResult[i].organizerName,
    isParticipantRegistered: isParticipantRegistered,
    hasParticipantAttended: 0,
    currentNumberOfParticipants: numberOfParticipants[0].currentNumberOfParticipants

  })
}
return result

}

const createEventUtil = async(eventInfo, authOrganizerInfo, image) => {
  const eventgeneralDetails = [ eventInfo.name, eventInfo.description, eventInfo.startDate, 
    eventInfo.endDate, eventInfo.registrationCloseDateTime,eventInfo.maxParticipants,
    eventInfo.whatsAppLink,eventInfo.status,authOrganizerInfo.id,image.buffer] 
    try{
    await makeDBQuery("INSERT INTO event(name,description,startDate, endDate, registrationCloseDateTime,maxParticipants, whatsappLink, status,organizerID,picture) VALUES  (?,?,?,?,?,?,?,?,?,?)" 
    ,eventgeneralDetails)
    }
    catch(e){
      return e.message
    }
    organizerID =[authOrganizerInfo.id]
    const result = await makeDBQuery("select event.id from event join organizer on event.organizerID = organizer.id where event.organizerid =? order by event.id DESC",organizerID)
    if(eventInfo.locatedEventData != undefined){
     const  eventlocation = [result[0].id,eventInfo.locatedEventData.city,eventInfo.locatedEventData.location[0],eventInfo.locatedEventData.location[1]]
     try{ 
     await makeDBQuery("insert into locatedevent (eventID,city,latitude,longitude) values (?,?,?,?) ",eventlocation)
     }
     catch(e){
       return e.message
     }
    }

    if(eventInfo.sessions!= undefined){
      numberOfSessions = eventInfo.sessions.length;
      for(i= 0; i<numberOfSessions;i++){
      const sessionData = [result[0].id,eventInfo.sessions[i].id,eventInfo.sessions[i].date,
      eventInfo.sessions[i].startTime,eventInfo.sessions[i].endTime,eventInfo.sessions[i].dayOfWeek]
    try{
      await makeDBQuery("insert into session (eventID,id,date,startTime,endTime,dayOfWeek) values (?,?,?,?,?,?)",sessionData)
      }
    catch(e){
      return e.message
    }
    }
  }     
  const eventID = result[0].id
  numberOfCategories = eventInfo.categories.length
 
  for(i = 0; i<numberOfCategories; i++){

  eventCategoriesData = [eventID, eventInfo.categories[i]]
  try{
  await makeDBQuery("insert into eventcategories(eventID,category) values (?,?)",eventCategoriesData )
  }
  catch(e){
    console.log(e)
    return e.message
  }
}

  if(eventInfo.maxParticipants!=-1 && eventInfo.locatedEventData !=undefined){

    for(i=0;i<numberOfSessions;i++){
      const limitedLocatedSessionData =[eventID,eventInfo.sessions[i].id,eventInfo.sessions[i].checkInTime]
     try{
      await makeDBQuery("insert into limitedlocatedsession (eventID,sessionID,checkInTime) values (?,?,?) ",limitedLocatedSessionData)
     }
     catch(e){
      console.log(e)
       return e.message
     }
    }
}

let finishDateTime = Date.parse(eventInfo.endDate +'T'+eventInfo.sessions[eventInfo.sessions.length-1].endTime)
finishDateTime = moment(finishDateTime).add(30, 'm').toDate()
let job = schedule.scheduleJob(finishDateTime, async () => {
  await ratingUtils.removePenatlyFromAnOrganizer(organizerID)
})

updateRatingMap[result[0].id] = job

return result[0].id
}


module.exports = {
  createEvent: async ( eventInfo ,authOrganizerInfo,image) => {
      return await createEventUtil(eventInfo, authOrganizerInfo, image)
},
 

  getOrganizerEvents: async (organizerID) => {
    try{
      return await getOrganizerEventsUtil(organizerID)
    }
    catch(e){
      return {failure: true, message: e.message}
    }
  },


  getEventByID: async (eventID) => {
    const result = []
    const eventResult = await makeDBQuery("SELECT id, name, description, picture,CONVERT(StartDate, char) as startDate, CONVERT(EndDate,char)as endDate, CONVERT(registrationCloseDateTime,char) as registrationCloseDateTime , maxParticipants, status, whatsAppLink, organizerID FROM event where event.ID =?",  
    eventID)
    let sessions = await makeDBQuery("select id,convert(session.date,char) as date,startTime,endTime,dayOfWeek from session where eventid = ? ORDER BY id ASC",eventID)
    sessions = JSON.parse(JSON.stringify(sessions))

    const categoriesResult = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
    const categories = []
    for(let k = 0; k < categoriesResult.length; k++)
    categories.push(categoriesResult[k].category)
 
    const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
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

    const canceledEventDataResult = await makeDBQuery("SELECT cancellationReason, convert(cancellationDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)
    
    let locatedEventData= null
    let locations = []
    if (locatedEventDataResult.length>0){
      locations.push(locatedEventDataResult[0].latitude)
      locations.push(locatedEventDataResult[0].longitude)
      locatedEventData = {
        city: locatedEventDataResult[0].city,
        location: locations
      }
    }

    let canceledEventData = null
    if (canceledEventDataResult.length > 0){
      canceledEventData = {
        cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
        cancellationReason: canceledEventDataResult[0].cancellationReason
      }
    }

    if(eventResult.length == 0 ){
    return null
    }

    const rating = await ratingUtils.getEventRating(eventResult[0].id)
    const numberOfParticipants = await makeDBQuery("SELECT COUNT(participantID) as currentNumberOfParticipants FROM participantsregisterinevent WHERE eventID = ? ", eventID)
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
        rating: rating,
        sessions: sessions,
        locatedEventData: locatedEventData,
        canceledEventData: canceledEventData,
        image: Buffer.from(eventResult[0].picture.buffer).toString('base64'),
        whatsAppLink: eventResult[0].whatsAppLink,
        currentNumberOfParticipants: numberOfParticipants[0].currentNumberOfParticipants
      })
      return result[0]
    
  },
  
    
    
    cancelEvent: async (canceledEventData,eventID, late, organizerID) => {
      cancelData = [eventID,canceledEventData.cancellationDateTime,canceledEventData.cancellationReason]
      const eventName = await makeDBQuery("SELECT name FROM event WHERE id = ?", eventID)
      const messageContent = "The event " + eventName[0].name +" has been canceled"
      if (tokens.getTokens().length > 0){
        const message = {
          data: {title: "Update", message: messageContent, eventID: eventID.toString()},
          tokens: tokens.getTokens()
        }
        admin.messaging().sendMulticast(message).then((response) => console.log(response))
      }
      try{
      await makeDBQuery("insert into canceledevent (eventid,cancellationdatetime,cancellationreason) values(?,?,?)",cancelData)
      if (late == "true"){
        await ratingUtils.applyPenaltyToAnOrganizer(organizerID)
      }
      if (updateRatingMap[eventID])
        updateRatingMap[eventID].cancel()
      return null
     }
     catch(e){
       return e.message
     }
    },

   
    getParticipantsOfAnEvent: async (eventID) => {
      const result = []
      const participants = await makeDBQuery("select participant.id,participant.firstName,participant.lastName,participant.rating from participant join participantsregisterinevent on participantsregisterinevent.participantID = participant.id where participantsregisterinevent.EventID =? "
      ,eventID)
      if(participants.length == 0){
        return null
        }        
      else{
        for(let i =0; i < participants.length; i++){
          result.push({
            id: participants[i].id,
            firstName: participants[i].firstName,
            lastName: participants[i].lastName,
            rating: participants[i].rating,
            arrivalTime: ""
          })
        }
        return result 
      }
    
   
    },
    getParticipantsDuringALimitedLocatedSession: async(eventID) =>{
      const result = []
      const participants = await makeDBQuery("select id, firstName,lastName,rating, checkIn.arrivalTime as arrivalTime FROM participant LEFT OUTER JOIN (SELECT * FROM checkInParticipant WHERE eventID = ?) as checkIn ON id = checkIn.participantID WHERE id in (SELECT participantID FROM participantsregisterinevent WHERE eventID = ?)"
      ,[eventID,eventID])
      if (participants.length == 0) return null
      for(i=0;i<participants.length;i++){
        let arrivalTime = ""
        if (participants[i].arrivalTime) arrivalTime = participants[i].arrivalTime
        result.push({
          id: participants[i].id,
          firstName: participants[i].firstName,
          lastName: participants[i].lastName,
          rating: participants[i].rating,
          arrivalTime: arrivalTime
        })
      }
      return result

    },


    getEventsFeedback:async (eventID) => {
      const result = []
      const feedback = await makeDBQuery ("select feedback,rating from  participantsrateevent where participantsrateevent.eventid =?",eventID)
      if(feedback.length == 0){
        return null
      }
      for(let i =0; i < feedback.length; i++){
        result.push({
          rating: feedback[i].rating,
          feedback: feedback[i].feedback
        })
      }
      return result
    },

    getOrganizerEventsForParticipantsApp: async (currentParticipantID,organizerID) => {
      const tempResult = await getOrganizerEventsUtil(organizerID)
      const result = []
      for(let i = 0; i < tempResult.length; i++){
        if (tempResult[i].status!=1) continue
        const registeredEvents = await makeDBQuery("SELECT EventID FROM participantsregisterinevent WHERE participantID = ? AND eventID IN (SELECT id FROM event WHERE OrganizerID = ?) AND eventID = ?", [currentParticipantID, organizerID, tempResult[i].id])
        const isParticipantRegistered = registeredEvents.length > 0
        const finishDateTime = Date.parse(tempResult[i].endDate +'T'+tempResult[i].sessions[tempResult[i].sessions.length-1].endTime)
        const now = Date.now()
        let hasParticipantAttended = 0
        if (now > finishDateTime){
          if (isParticipantRegistered){
            if (tempResult[i].locatedEventData!=null && tempResult[i].maxParticipants>0){
              const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, tempResult[i].id])
              if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
              else hasParticipantAttended = 2
            }
            else{
              hasParticipantAttended = 1
            }
          }
          else {
            hasParticipantAttended = 2
          }
        }
        else{
          const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, tempResult[i].id])
          if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
        }

        let feedback = null
        if (hasParticipantAttended == 1){
          const tempFeedback = await makeDBQuery("SELECT rating, feedback FROM participantsrateevent WHERE participantID = ? AND eventID = ?", [currentParticipantID, tempResult[i].id])
          if (tempFeedback.length>0){
            feedback = {
              rating: tempFeedback[0].rating,
              feedback:  tempFeedback[0].feedback
            }
          }
        }

        const rating = await ratingUtils.getEventRating(tempResult[i].id)

        result.push({
          id: tempResult[i].id,
          description: "",
          name: tempResult[i].name,
          categories: tempResult[i].categories,
          startDate: tempResult[i].startDate,
          endDate: tempResult[i].endDate,
          registrationCloseDateTime: tempResult[i].registrationCloseDateTime,
          rating: rating,
          sessions: tempResult[i].sessions,
          feedback: feedback,
          locatedEventData: tempResult[i].locatedEventData,
          canceledEventData: tempResult[i].canceledEventData,
          maxParticipants: tempResult[i].maxParticipants,
          image: "",
          organizerID: organizerID,
          organizerName: "",
          isParticipantRegistered: isParticipantRegistered,
          hasParticipantAttended: hasParticipantAttended,
          currentNumberOfParticipants: tempResult[i].currentNumberOfParticipants
        })

      }
      return result
    },

    getUpcomingEvents: async (currentParticipantID) =>{
      const eventResult = await makeDBQuery("SELECT event.id as id, event.name as name, CONVERT(event.startDate, char) as startDate, CONVERT(event.endDate, char) as endDate, CONVERT(event.registrationCloseDateTime,char) as registrationCloseDateTime, event.maxParticipants, organizer.id as organizerID, organizer.name as organizerName FROM event JOIN organizer on organizer.id = event.organizerID and event.status = 1 AND cast(concat(event.startDate, ' ',(SELECT startTime FROM session where ID = 1 AND eventID = event.id) ) as datetime) > NOW() ")
      return await prepareUpcomingEventsUtil(currentParticipantID,eventResult)
  },

  getUpcomingEventsByFollowedOrganizers: async (currentParticipantID) => {
      const eventResult = await makeDBQuery("SELECT event.id as id, event.name as name, CONVERT(event.startDate, char) as startDate, CONVERT(event.endDate, char) as endDate, CONVERT(event.registrationCloseDateTime,char) as registrationCloseDateTime, event.maxParticipants, organizer.id as organizerID, organizer.name as organizerName FROM event JOIN organizer on organizer.id = event.organizerID and event.status = 1 AND cast(concat(event.startDate, ' ',(SELECT startTime FROM session where ID = 1 AND eventID = event.id) ) as datetime) > NOW() AND organizer.id IN (SELECT organizerID FROM participantsfolloworganizer WHERE participantID = ?)", currentParticipantID)
    return await prepareUpcomingEventsUtil(currentParticipantID,eventResult)
  },

  getEventByIdForParticipant: async (currentParticipantID, eventID) => {
    const eventResult = await makeDBQuery("SELECT event.id as id, event.name as name, event.description, event.picture, CONVERT(event.startDate,char) as startDate, CONVERT(event.endDate,char) as endDate, CONVERT(event.registrationCloseDateTime,char) as registrationCloseDateTime, event.maxParticipants, organizer.id as organizerID, organizer.name as organizerName FROM event JOIN organizer ON event.organizerID = organizer.id and event.status = 1  and event.id = ?", eventID)
    let registeredEvents = await makeDBQuery("SELECT EventID FROM participantsregisterinevent WHERE participantID = ? and eventID = ?", [currentParticipantID,eventID])
    let sessions = await makeDBQuery("select id, convert(date,char) AS date, startTime, endTime, dayOfWeek FROM session WHERE eventID =?"
    ,eventID)
    sessions = JSON.parse(JSON.stringify(sessions))

    const categoriesResult = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
    const categories = []
    for(k = 0; k < categoriesResult.length; k++)
    categories.push(categoriesResult[k].category)
 
    const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
    
    if (eventResult[0].maxParticipants > 0 && locatedEventDataResult.length >0){
      let limitedLocatedSessionData = await makeDBQuery("SELECT checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", eventID)
      //limitedLocatedSessionData = JSON.parse(JSON.stringify(limitedLocatedSessionData))
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = limitedLocatedSessionData[0].checkInTime
      }
    }
    else{
      for(j =0; j< sessions.length; j++){
        sessions[j].checkInTime = ""
      }
    }

    const canceledEventDataResult = await makeDBQuery("SELECT cancellationReason, convert(cancellationDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)
    
    let locatedEventData= null
    let locations = []
    if (locatedEventDataResult.length>0){
      locations.push(locatedEventDataResult[0].latitude)
      locations.push(locatedEventDataResult[0].longitude)
      locatedEventData = {
        city: locatedEventDataResult[0].city,
        location: locations
      }
    }

    let canceledEventData = null
    if (canceledEventDataResult.length > 0){
      canceledEventData = {
        cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
        cancellationReason: canceledEventDataResult[0].cancellationReason
      }
    }
    const numberOfParticipants =  await  makeDBQuery("SELECT COUNT(participantID) as currentNumberOfParticipants FROM participantsregisterinevent WHERE eventID = ? ", eventID)
    const isParticipantRegistered = registeredEvents.length > 0
    const finishDateTime = Date.parse(eventResult[0].endDate +'T'+sessions[sessions.length-1].endTime)
    const now = Date.now()
    let hasParticipantAttended = 0
    if (now > finishDateTime){
      if (isParticipantRegistered){
        if (eventResult[0].locatedEventData!=null && eventResult[0].maxParticipants>0){
          const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[0].id])
          if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
          else hasParticipantAttended = 2
        }
        else{
          hasParticipantAttended = 1
        }
      }
      else {
        hasParticipantAttended = 2
      }
    }
    else{
      const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[0].id])
      if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
    }

    let feedback = null
    if (hasParticipantAttended == 1){
      const tempFeedback = await makeDBQuery("SELECT rating, feedback FROM participantsrateevent WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[0].id])
      if (tempFeedback.length>0){
        feedback = {
          rating: tempFeedback[0].rating,
          feedback:  tempFeedback[0].feedback
        }
      }
    }
    const rating = await ratingUtils.getEventRating(eventResult[0].id)
    return {
      id: eventResult[0].id,
      name: eventResult[0].name,
      description: eventResult[0].description,
      categories: categories,
      startDate: eventResult[0].startDate,
      endDate: eventResult[0].endDate,
      registrationCloseDateTime: eventResult[0].registrationCloseDateTime,
      rating: rating,
      sessions: sessions,
      feedback: feedback,
      locatedEventData: locatedEventData,
      canceledEventData: canceledEventData,
      maxParticipants: eventResult[0].maxParticipants,
      image: Buffer.from(eventResult[0].picture.buffer).toString('base64'),
      organizerID: eventResult[0].organizerID,
      organizerName: eventResult[0].organizerName,
      isParticipantRegistered: isParticipantRegistered,
      hasParticipantAttended: hasParticipantAttended,
      currentNumberOfParticipants: numberOfParticipants[0].currentNumberOfParticipants
    }
  },

  getParticipantEvents: async (currentParticipantID) => {
    const eventResult = await makeDBQuery("SELECT event.id as id, event.name as name, CONVERT(event.startDate,char) as startDate, CONVERT(event.endDate,char) as endDate, CONVERT(event.registrationCloseDateTime,char) as registrationCloseDateTime, event.maxParticipants, organizer.id as organizerID, organizer.name as organizerName FROM event JOIN organizer ON event.organizerID = organizer.id JOIN participantsregisterinevent ON participantsregisterinevent.eventid = event.id and event.status = 1  and participantsregisterinevent.participantID = ?", currentParticipantID)
    const result = []
    for(let i =0;i< eventResult.length; i++){
      let eventID = eventResult[i].id
      const numberOfParticipants = await makeDBQuery("SELECT COUNT(participantID) as currentNumberOfParticipants FROM participantsregisterinevent WHERE eventID = ? ", eventID)
     
      let sessions = await makeDBQuery("select id,convert(session.date,char) as date,startTime,endTime,dayOfWeek from session where eventid =?",eventID)
      sessions = JSON.parse(JSON.stringify(sessions))
      const categoriesResult = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
      const categories = []
      for(k = 0; k < categoriesResult.length; k++)
      categories.push(categoriesResult[k].category)
   
      const locatedEventDataResult = await makeDBQuery("SELECT city, longitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
      
      if (eventResult[i].maxParticipants > 0 && locatedEventDataResult.length >0){
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
  
      const canceledEventDataResult = await makeDBQuery("SELECT cancellationReason, convert(cancellationDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)
      
      let locatedEventData= null
      let locations = []
      if (locatedEventDataResult.length>0){
        locations.push(locatedEventDataResult[0].latitude)
        locations.push(locatedEventDataResult[0].longitude)
        locatedEventData = {
          city: locatedEventDataResult[0].city,
          location: locations
        }
      }
  
      let canceledEventData = null
      if (canceledEventDataResult.length > 0){
        canceledEventData = {
          cancellationDateTime: canceledEventDataResult[0].cancellationDateTime,
          cancellationReason: canceledEventDataResult[0].cancellationReason
        }
      }

      const finishDateTime = Date.parse(eventResult[i].endDate +'T'+sessions[sessions.length-1].endTime)
      const now = Date.now()
      let hasParticipantAttended = 0
      if (now > finishDateTime){
        if (locatedEventData!=null && eventResult[i].maxParticipants>0){
          const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[i].id])
          if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
          else hasParticipantAttended = 2
        }
        else{
          hasParticipantAttended = 1
        }
      }
      else{
        const limitedLocatedSessions = await makeDBQuery("SELECT SessionID FROM checkinparticipant WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[i].id])
        if (limitedLocatedSessions.length > 0) hasParticipantAttended = 1
      }

      let feedback = null
      if (hasParticipantAttended == 1){
        const tempFeedback = await makeDBQuery("SELECT rating, feedback FROM participantsrateevent WHERE participantID = ? AND eventID = ?", [currentParticipantID, eventResult[i].id])
        if (tempFeedback.length>0){
          feedback = {
            rating: tempFeedback[0].rating,
            feedback:  tempFeedback[0].feedback
          }
        }
      }
      const rating = await ratingUtils.getEventRating(eventResult[i].id)
      result.push({
        id: eventResult[i].id,
        description: "",
        name: eventResult[i].name,
        categories: categories,
        startDate: eventResult[i].startDate,
        endDate: eventResult[i].endDate,
        registrationCloseDateTime: eventResult[i].registrationCloseDateTime,
        rating: rating,
        sessions: sessions,
        feedback: feedback,
        locatedEventData: locatedEventData,
        canceledEventData: canceledEventData,
        maxParticipants: eventResult[i].maxParticipants,
        image: "",
        organizerID: eventResult[i].organizerID,
        organizerName: eventResult[i].organizerName,
        isParticipantRegistered: true,
        hasParticipantAttended: hasParticipantAttended,
        currentNumberOfParticipants: numberOfParticipants[0].currentNumberOfParticipants
      })
    }
    return result
  },

  prepareToCheckInParticipant: async (eventID, sessionID, participantID) => {
    const isRegistered = await makeDBQuery("SELECT firstName, lastName FROM participant JOIN participantsregisterinevent on participant.id = participantsregisterinevent.participantID and participant.id = ? and participantsregisterinevent.eventID = ? ", [participantID,eventID])

    if (isRegistered.length == 0) return 1
    
    const hasAlreadyCheckedIn = await makeDBQuery("SELECT * FROM checkinparticipant WHERE participantID = ? AND eventID = ? and sessionID = ?", [participantID, eventID, sessionID])

    if (hasAlreadyCheckedIn.length == 1) return 2

    return isRegistered[0].firstName + " " + isRegistered[0].lastName

  },

  checkInParticipant: async (eventID, sessionID, participantID, organizerID) => {
    await makeDBQuery("INSERT INTO checkInParticipant(organizerID, participantID, eventID, sessionID, arrivalTime) VALUES (?,?,?,?,?)", [organizerID,participantID,eventID,sessionID, moment().utc(Date.now()).tz('Asia/Amman').format("HH:mm:ss")])
  },

  getEventStatistics: async (eventID) => {
    const totalRegistered = await makeDBQuery("SELECT COUNT(participantID) AS total FROM participantsRegisterInEvent WHERE eventID = ?", eventID)
    let sessionsData = await makeDBQuery("SELECT sessionID, IFNULL((SELECT COUNT(*) FROM checkInParticipant WHERE sessionID = sessionID AND eventID = 7),0) as total, IFNULL(CONVERT(FROM_UNIXTIME(ROUND(AVG(UNIX_TIMESTAMP(arrivalTime)))),char) , \"\") as avgArrivalTime FROM checkInParticipant WHERE eventID = ? GROUP by sessionID order by sessionID ASC"
    ,eventID)
    let allSessions = await makeDBQuery("SELECT id FROM session WHERE eventID = ?", eventID)
    sessionsData = JSON.parse(JSON.stringify(sessionsData))
    let toAdd = []
    for(let i =0;i<allSessions.length; i++){
      let found = false
      for(let j = 0; j < sessionsData.length; j++){
        if (allSessions[i].id == sessionsData[j].sessionID){
          found = true
          break
        }
      }
      if (!found){
        toAdd.push(allSessions[i].id)
      }
    }
    let finalSessions = []
    let i =0
    let j = 0
    while (i < sessionsData.length || j <toAdd.length){
      if (i >= sessionsData.length){
        finalSessions.add({
          id: toAdd[j],
          total: -1,
          avgArrivalTime: ""
        })
        j++
      }
      else if (j >= toAdd.length){
        finalSessions.add(sessionsData[i])
        i++
      }
      else{
        if (toAdd[j] > sessionsData[i].sessionID){
          finalSessions.add(sessionsData[i])
          i++
        }
        else{
          finalSessions.add({
            id: toAdd[j],
            total: -1,
            avgArrivalTime: ""
          })
          j++
        }
      }
    }


    const res = {
      total: totalRegistered[0].total,
      sessions: finalSessions
    }

    return res
  },

  addParticipantRating: async (participantID, eventID, feedback) => {
    try{
      await ratingUtils.addParticipantRating(participantID, eventID, feedback.rating, feedback.feedback)
      return null
    }
    catch(e){
      return e.message
    }
  },

  emailParticipantsOfAnEvent: async (eventID, emailData) => {
    const participants = await makeDBQuery("SELECT participant.email FROM participant JOIN participantsregisterinevent ON participant.id = participantsregisterinevent.participantID AND participantsregisterinevent.eventID = ?", eventID)
    const eventData = await makeDBQuery("SELECT event.name AS eventName, organizer.name AS organizerName FROM event JOIN organizer ON event.organizerID = organizer.id and event.id = ?", eventID)
    if (participants.length == 0) return 404
    const emailList = []
    for(let i = 0; i < participants.length; i++){
      emailList.push(participants[i].email)
    }
    let preMessage = "The following email is sent by " + eventData[0].organizerName +", who is organizing the event: " + eventData[0].eventName +"\n"
    preMessage += "You recieved this email because you are currently registered in this event.\n----------------------------------------------\n"
    emailUtils.sendMultipleEmails(emailList, emailData[0], preMessage + emailData[1])
  },

  editPendingEvent: async (currentEventID, newEvent, organizerID, image) => {
    if(updateRatingMap[currentEventID])updateRatingMap[currentEventID].cancel()
    try{
      if (image == undefined){
        const currentImg = await makeDBQuery("SELECT picture FROM event WHERE id = ?", currentEventID)
        image = {buffer:currentImg[0].picture}
      }
      await makeDBQuery("DELETE FROM event WHERE id = ?", currentEventID)
      const result = await createEventUtil(newEvent, {id: organizerID}, image)
      if(!isNaN(result))
        return {code:201, id: result}
      else{
        if(result.includes("ER_DUP_ENTRY"))
            return {code:409}
        else if(result.includes("ER_NO_REFERENCED"))
            return {code:406}
        else return {code:500}
      }
    }
    catch(e){
      return e.message
    }
  },

  editConfirmedEvent: async (eventID, updatedEvent, organizerID) =>{
    try{
      await makeDBQuery("DELETE FROM session WHERE eventID = ?", eventID)
      await makeDBQuery("DELETE FROM locatedevent WHERE eventID = ?", eventID)

      await makeDBQuery("UPDATE event SET startDate = ?, endDate = ?, registrationCloseDateTime = ? WHERE id  = ?", [updatedEvent.startDate, updatedEvent.endDate, updatedEvent.registrationCloseDateTime, eventID])

      if(updatedEvent.locatedEventData != undefined){
        const  eventlocation = [eventID,updatedEvent.locatedEventData.location[0],updatedEvent.locatedEventData.location[1]]
        await makeDBQuery("insert into locatedevent (eventID,latitude,longitude) values (?,?,?) ",eventlocation)
      }

      for(let i= 0; i<updatedEvent.sessions.length;i++){
        const sessionData = [eventID,updatedEvent.sessions[i].id,updatedEvent.sessions[i].date,
        updatedEvent.sessions[i].startTime,updatedEvent.sessions[i].endTime,updatedEvent.sessions[i].dayOfWeek]
        await makeDBQuery("insert into session (eventID,id,date,startTime,endTime,dayOfWeek) values (?,?,?,?,?,?)",sessionData)
      }

      if (updatedEvent.sessions[0].checkInTime!=""){
        for(let i=0;i<updatedEvent.sessions.length;i++){
          const limitedLocatedSessionData =[eventID,updatedEvent.sessions[i].id,updatedEvent.sessions[i].checkInTime]
          await makeDBQuery("insert into limitedlocatedsession (eventID,sessionID,checkInTime) values (?,?,?) ",limitedLocatedSessionData)
        }
      }
      if (updateRatingMap[eventID])
        updateRatingMap[eventID].cancel

      let finishDateTime = Date.parse(updatedEvent.endDate +'T'+updatedEvent.sessions[updatedEvent.sessions.length-1].endTime)
      finishDateTime = moment(finishDateTime).add(30, 'm').toDate()
      let job = schedule.scheduleJob(finishDateTime, async () => {
        await ratingUtils.removePenatlyFromAnOrganizer(organizerID)
      })
      updateRatingMap[eventID] = job

      const eventName = await makeDBQuery("SELECT name FROM event WHERE id = ?", eventID)
      const messageContent = "The event " + eventName[0].name +" has been modified, tap this notification to view the changes"
      if (tokens.getTokens().length == 0) return null
      const message = {
        data: {title: "Update", message: messageContent, eventID: eventID.toString()},
        tokens: tokens.getTokens()
      }
      admin.messaging().sendMulticast(message).then((response) => console.log(response))
      return null
    }
    catch(e){
      console.log(e)
      return e.message
    }
  }

}