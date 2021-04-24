const express = require('express')
const OrganizerRouter = require('./routers/OrganizerRouter')
const ParticipantRouter = require('./routers/ParticipantsRouter')
const EventRouter = require('./routers/eventrouter')
//const AdminRouter = require('./models/AdminRouter')
const app = express()

app.use(express.json())
//app.use(AdminRouter)
app.use(EventRouter)
app.use(OrganizerRouter)
app.use(ParticipantRouter)
const port = process.env.PORT || 3000

app.listen(port,()=>{
    console.log("port is up on "+ port)
})