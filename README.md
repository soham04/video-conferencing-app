# Peerply, the video conferencing solution

A [WebRTC](https://webrtc.org/) based video conferencing web app.

The project is made following the `MVC architecture`

Deployed on https://callify.onrender.com/

Software Requirements Specification (SRS) : [DOC](https://github.com/soham04/video-conferencing-app/raw/main/Callify%20SRS.docx)

---
## Installation

System Requirements `Nodev16.15.1` and `NPMv8.11.0` 

While clonning dont forget to add the .env file too with the following Environmental variables

```
clientID="2888xxxxxxxx-db36qcrs3q8dqggck53e6duiutji6qe2.apps.googleusercontent.com"
CLIENT_SECRET="GOCSPX-o-Qil68R7vxxxxxxxxdur_P5Yu9X"
MONGO_DB_LINK="mongodb+srv://xxxxxxx:xxxxxxx@cluster0.dfruy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
SECRET="xyz."
```

For intalling the depenencies run the following command

    $ npm i

Run the server by using the following command

    $ npm start


---

## Features

* Video conferencing 
* Text chat
* Google OAuth2.0
* Screen sharing
* Whiteboard
* Link sharing

## Packages used

     body-parser 
     cookie-session 
     dotenv 
     ejs 
     express 
     express-session 
     mongodb
     mongoose 
     mongoose-encryption 
     mongoose-findorcreate 
     passport 
     passport-google-oauth20 
     passport-local
     passport-local-mongoose 
     socket.io 
     uuid4 

