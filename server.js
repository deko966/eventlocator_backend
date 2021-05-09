const path = require('path')
const express = require('express')
const OrganizerRouter = require('./routers/OrganizerRouter')
const ParticipantRouter = require('./routers/ParticipantsRouter')
const EventRouter = require('./routers/eventrouter')
const AdminRouter = require('./routers/AdminRouter')
const bodyParser = require('body-parser')

var cookieParser = require('cookie-parser');

require('./utils/firebaseInit')
const app = express()


app.set('view engine', 'ejs');
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname+'/routers/public')))
app.use(express.json())
app.use(AdminRouter)
app.use(EventRouter)
app.use(OrganizerRouter)
app.use(ParticipantRouter)
const port = process.env.PORT || 8080



app.listen(port,()=>{
    console.log("port is up on "+ port)
})