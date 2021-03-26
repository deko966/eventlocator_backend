getEventDetailsByID: async (eventData) => {
    eventID = [eventData]

    const eventResult = await makeDBQuery("SELECT id, name, description, picture,CONVERT(StartDate, char) as startDate, CONVERT(EndDate,char)as endDate, CONVERT(registrationCloseDateTime,char) as registrationCloseDateTime , maxParticipants, status, rating, whatsAppLink, organizerID FROM event where event.ID =?",  
    eventID)

    const sessions = await makeDBQuery("select session.id,convert(session.date,char) as date,session.startTime,session.endTime,session.dayOfWeek from event,session where event.status <> 2 and event.id =?"
    ,eventID)    
    const categories = await makeDBQuery("select category from eventcategories where eventID =?",eventID)
  
 
    const locatedEventDataResult = await makeDBQuery("SELECT city, longtitude, latitude FROM locatedevent WHERE EventID = ?", eventID)
    
    let locatedEventData= null
    if (locatedEventDataResult.length>0)
    locatedEventData = {
      city: locatedEventDataResult[0].city,
      location: [locatedEventDataResult[0].latitude, locatedEventDataResult[0].longitude]
    }
    
    if (eventResult.maxParticipants > 0 && locatedEventDataResult.length >0){
      let limitedLocatedSessionData = await makeDBQuery("SELECT checkInTime FROM limitedLocatedSession WHERE EventID = ? ORDER BY SessionID ASC ", eventID)
      for(i =0; i< sessions.length; i++){
        sessions[i].checkInTime = limitedLocatedSessionData[i]
      }
    }

    const canceledEventDataResult = await makeDBQuery("SELECT cancelationReason, convert(cancelDateTime,char) as cancellationDateTime from canceledevent where EventID = ?", eventID)
    
    if (locatedEventDataResult.length>0)
    locatedEventData = {
      city: locatedEventDataResult[0].city,
      location: [locatedEventDataResult[0].latitude, locatedEventDataResult[0].longitude]
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

       eventResult.push({
        id: eventResult.id,
        name: eventResult.name,
        description: eventResult.description,
        categories: categories,
        startDate: eventResult.startDate,
        endDate: eventResult.endDate,
        registrationCloseDateTime: eventResult.registrationCloseDateTime,
        status: eventResult.status,
        maxParticipants: eventResult.maxParticipants,
        rating: eventResult.rating,
        sessions: sessions,
        participants: [],
        feedback: [],
        locatedEventData: locatedEventData,
        canceledEventData: canceledEventData,
        image: Buffer.from(eventResult.picture.buffer).toString('base64'),
        whatsAppLink: eventResult.whatsAppLink
      })
      return eventResult
    
  },
  