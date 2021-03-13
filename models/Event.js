var sql = require('./db.js')
module.exports = {
    createEvent: ( event ) => {
   
    return new Promise(resolve => {
        input = [event.ID, event.Name, event.Description, event.NumberOfParticipants, event.StartDate, event.EndDate, event.RegistrationCloseDateTime, event.EventStatus, event.WhatsappLink] 
        sql.query("INSERT INTO event(ID, Name, Description, NumberOfParticipants, StartDate, EndDate, RegistrationCloseDateTime, EventStatus, WhatsappLink) VALUES  (?,?,?,?,?,?,?,?,?)" 
        ,input,  (err, result)=> {
            if (err) {
          resolve({undefined,err})
            }
            else{
         resolve({result, undefined})
          }
        });
    })
    },
    ParticipantRegisterEvent:( event) =>{
        
    return new Promise(resolve => {
        input = event.ID
        sql.query("SELECT participant.FirstName,participant.LastName FROM participant  JOIN participantregisterinevent  ON participant.ID = participantregisterinevent.participantID   AND participantregisterinevent.eventID = ?"
        ,input,  (err, result)=> {
            if (err) {
          resolve({undefined,err})
            }
            else{
         resolve({result, undefined})
          }
        });
    })
    },
    eventDetails:( event) =>{
        
        return new Promise(resolve => {
            input = event.ID
            sql.query("SELECT ID, Name, Description, NumberOfParticipants, StartDate, EndDate, RegistrationCloseDateTime, EventStatus, WhatsappLink from event where ID = ?" 
            ,input,  (err, result)=> {
                if (err) {
              resolve({undefined,err})
                }
                else{
             resolve({result, undefined})
              }
            });
        })
    },   
}

