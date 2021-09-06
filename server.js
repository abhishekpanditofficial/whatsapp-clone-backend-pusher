import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import morgan from 'morgan';
import Pusher from 'pusher';
import cors from 'cors';

const app= express();
const port= process.env.PORT || 9000;

var pusher = new Pusher({
    appId: '1073337',
    key: 'pusher-key',
    secret: 'pusher-secret',
    cluster: 'pusher-cluster',
    encrypted: true
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
const connection_url= 'connection url';
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