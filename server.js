import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import morgan from 'morgan';
import Pusher from 'pusher';
import cors from 'cors';

const app= express();
const port= process.env.PORT || 9000;

var pusher = new Pusher({
    appId: "1262314",
    key: "c9b95814ba7f97fd9aa7",
    secret: "e3c03cd4277d3a61378e",
    cluster: "ap2",
    useTLS: true
  });
  

app.use(morgan('dev'));
app.use(express.json());

/* app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});
 */
app.use(cors());
const connection_url= process.env.DATABASE_URL.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(connection_url,{
    useCreateIndex: true,  
    useNewUrlParser:true,
    useUnifiedTopology: true
}).then(res => {
    console.log('DATABASE SUCCESFULLY CONNECTED!');
});

const db= mongoose.connection;
db.once('open',()=>{
    console.log("DB connected");
 const msgCollection= db.collection("messagecontents");
 const changeStream= msgCollection.watch();

 changeStream.on('change',(change)=>{
     console.log(change);
     if(change.operationType === 'insert'){
         const messageDetails= change.fullDocument;
         pusher.trigger('messages','inserted',{
             name: messageDetails.name,
             message: 'This is Working !!!',
             timestamp: messageDetails.timestamp,
             received: messageDetails.received
         });
     }else {
         console.log('Error trigerring pusher');
     }
 });
});





 


app.get('/',(req,res) => {
    res.status(200).send('hello world');
});

app.post('/messages/new',(req,res)=>{
    const dbMessage= req.body;
    
    Messages.create(dbMessage,(err,data) =>{
        if(err) {
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    });
    
});

app.get('/messages/sync',(req,res) =>{
    Messages.find((err,data) =>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    });
});

app.listen(port,() => {
    console.log(`LISTENING ON ${port}`);
})