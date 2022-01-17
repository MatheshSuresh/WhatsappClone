const express = require('express')
const mongoose = require('mongoose');
const Rooms = require('./dbRooms');
const cors = require('cors');
const Messages = require('./dbMessages');
const Pusher = require("pusher");

const pusher = new Pusher({
    appId: "1333150",
    key: "de9c80a25d63a706b421",
    secret: "f3308c356e41a54934b1",
    cluster: "ap2",
    useTLS: true
  });

const app = express()

app.use(cors())
app.use(express.json())

const dbUrl = `mongodb+srv://mathesh:mathesh@streamapps.kzobm.mongodb.net/whatsappclone?retryWrites=true&w=majority`;
mongoose.connect(dbUrl)

const db = mongoose.connection
db.once("open", ()=>{
    console.log("DB Connected");
    const roomCollection = db.collection("rooms");
    const changeStream = roomCollection.watch();
    changeStream.on("change", (change)=>{
        if(change.operationType==="insert"){
            const roomDetails = change.fullDocument;
            pusher.trigger("room","inserted",roomDetails)
        }else{
             console.log("Not Expected Event to trigger")
        }
    })

    const msgCollection = db.collection("messages");
    const changeStream1 = msgCollection.watch();
    changeStream1.on("change", (change)=>{
        if(change.operationType==="insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages","inserted",messageDetails)
        }else{
             console.log("Not Expected Event to trigger")
        }
    })
})

app.get('/', (req, res)=>{
    res.send('Hello From Backend')
})

app.get('/messages/:id',(req,res)=>{
    Messages.find({
        roomId:req.params.id
    }, (err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/group/create',(req,res)=>{
    const name = req.body.groupName;
    Rooms.create({name}, (err, data)=> {
        if(err){
            return res.status(500).send(err)
        }else{
            return res.status(201).send(data)
        }
    })
})

app.post('/messages/new', (req, res)=>{
    const dbMessage = req.body
    Messages.create(dbMessage, (err,data)=>{
        if(err){
            return res.status(500).send(err)
        }
        else{
            return res.status(201).send(data)
        }
    })
})

app.get('/all/rooms', (req,res)=>{
    Rooms.find({},(err,data)=>{
        if(err){
            return res.status(500).send(err)
        }
        else{
            return res.status(200).send(data)
        }
    })
})

app.get('/rooms/:id',(req, res)=>{
    Rooms.find({_id:req.params.id}, (err,data)=>{
        if(err){
            return res.status(500).send(err)
        }else{
            return res.status(200).send(data[0])
        }
    })
})

app.listen(5000, ()=>{
    console.log("Server is up and running");
})