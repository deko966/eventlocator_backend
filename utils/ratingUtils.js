const sql = require('../models/db.js')

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

  const getFinishedEvents = async (organizerID) => {
      const result = []
      const events = await makeDBQuery("SELECT id from event WHERE organizerID = ? AND ")
      for(let i = 0; i< events.length; i ++ ){
        let lastSessionEndTime = await makeDBQuery("SELECT endTime from session WHERE eventID = ? AND id = (SELECT MAX(id) FROM session WHERE eventID = ?)", [events[i].id, events[i].id])
        lastSessionEndTime = lastSessionEndTime[0].endTime
        const eventFinished = await makeDBQuery("SELECT id FROM event WHERE id = ? AND CAST(CONCAT(event.endDate, ' ', ?) AS datetime) < NOW()", [events[i].id, lastSessionEndTime])
        if (eventFinished.length > 0){
            result.push(eventFinished[0].id)
        }
      }
      return result
  }

  const getEventRatingUtil = async (eventID) => {
    const result = await makeDBQuery("SELECT Rating from participantsrateevebt WHERE eventID = ?", eventID)
    if (result.length == 0)return -1
    else{
        let sum = 0;
        for(let i = 0; i< result.length; i++){
            sum += result[0].rating
        }
        return sum/rating.length
    }
  }

  const getOrganizerRatingUtil = async (organizerID) => {
    const result = await getFinishedEvents(organizerID)
    if (result.length == 0) return 5.0
    let count = 0
    let sum = 0.0;
    for(let i = 0; i < result.length; i++ ){
        const temp = await getEventRatingUtil(result[i])
        if (temp!=-1){
            count ++;
            sum += temp;
        }
    }
    return sum/count
  }

  const checkToSuspendOrganizer = async (organizerID) => {
      const rating = await getOrganizerRatingUtil(organizerID)
      if (rating < 3.0){
          await makeDBQuery("UPDATE organizer SET accountStatus = 3 WHERE id = ?", organizerID)
      }
  }

module.exports = {
    getOrganizerRating: async (organizerID) => {
        return getOrganizerRatingUtil(organizerID)
    },

    getEventRating: async (eventID) => {
        return this.getEventRatingUtil(eventID)
    },

    applyPenaltyToAnOrganizer: async (organizerID) => {
        await makeDBQuery("UPDATE organizer SET ratingPenalty = ratingPenatly + 0.4 WHERE organizerID = ?", organizerID)
        checkToSuspendOrganizer(organizerID)
    },

    removePenatlyFromAnOrganizer: async (organizerID) => {
        await makeDBQuery("UPDATE organizer SET ratingPenalty = GREATEST(ratingPenatly - 0.2, 0.0) WHERE organizerID = ?", organizerID)
    },

    applyParticipantRating: async (participantID, eventID, rating, feedback) => {
        await makeDBQuery("INSERT INTO participantsRateEvent VALUES(?,?,?,?)",[eventID, participantID, rating, feedback])
        let organizerID = await makeDBQuery("SELECT organizerID FROM event WHERE id = ?", eventID)
        await checkToSuspendOrganizer(organizerID[0].organizerID)
    },

    alterParticipantRatingAfterLimitedLocatedEvent: async (participantID,eventID) => {
        const isRegistered = await makeDBQuery("SELECT * FROM participantsregisterinevent WHERE participantID = ? AND eventID = ?", [participantID, eventID])

        if (isRegistered.length == 0)return
        else{
            const hasAttended = await makeDBQuery("SELECT * FROM checkinparticipant WHERE participantID = ? and eventID = ?", [participantID, eventID])
            if (hasAttended.length > 0){
                await makeDBQuery("UPDATE participant SET rating = LEAST(5.0, rating + 0.2) WHERE id = ?", participantID)
            }
            else{
                await makeDBQuery("UPDATE participant SET rating = rating - 0.4 WHERE id = ?", participantID)
                const currentRating = await makeDBQuery("SELECT rating FROM participant WHERE id = ?", participantID)
                if (currentRating[0].rating < 2.5){
                    await makeDBQuery("UPDATE participant SET accountStatus = 1 WHERE id = ?", participantID)
                }
            }
        }
    }
}