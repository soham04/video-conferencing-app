# Callify, the video conferencing solution

A **[WebRTC](https://webrtc.org/)** based video conferencing web app.

The project follows the **MVC architecture** and adheres to the **Software Development Lifecycle (SDLC)**. The goal of this project was to understand various phases of **SDLC** and develop an application service in a team setting. It was part of the **CSE312 Software Engineering and Project Management** course and was taught by professor [Divya Sindhu Lekha](https://www.iiitkottayam.ac.in/#!/faculty/divya).

## Table of Contents - 
- [Deployment Details](#deployment-details) 
- [Software Requirements Specification (SRS)](#software-requirements-specification-srs) 
- [Installation](#installation) 
- [Features](#features) 
- [NPM Packages Used](#npm-packages-used) 
- [Future Scope](#future-scope)

## Deployment Details
[](https://emojipedia.org/warning)

### ⚠️ Please note that due to being on free tier the service spins down due to inactivity resulting in an initial delay in the dialup

**Live Links** 
- (Permanent Link)  [https://ssss-szv1.onrender.com/](https://ssss-szv1.onrender.com/)
- (Temporary)   [https://callify.sohamshinde.info/](https://callify.sohamshinde.info/dash)

**Deployment details :** 
   -  Service : Render.com
   - Instance Type : Free 0.1 CPU 512 MB
   - Type : Docker deployment

## Software Requirements Specification (SRS) 
[DOC](https://github.com/soham04/video-conferencing-app/raw/main/project-documents/Callify%20SRS.docx)


## Installation

System Requirements **Node v16.15.1** and **NPM v8.11.0** 

 - **Environment variables**
 -Create a `.env` file and configure the following variables:
 ```
clientID="2888xxxxxxxx-db36qcrs3q8dqggck53e6duiutji6qe2.apps.googleusercontent.com"
CLIENT_SECRET="GOCSPX-o-Qil68R7vxxxxxxxxdur_P5Yu9X"
MONGO_DB_LINK="mongodb+srv://xxxxxxx:xxxxxxx@cluster0.dfruy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
SECRET="xyz."
```


- For installing the dependencies run the following command
```
    $ npm i
```
- Run the server by using the following command
```
    $ npm start
```



## Features

-   ✅ **Live Video Conferencing**
-   ✅ **Live Text Chat**
-   ✅ **Google OAuth 2.0 Authentication**
-   ✅ **Live Screen Sharing**
-   ✅ **Live Whiteboard**
-   ✅ **Room Link Sharing**

## NPM Packages used

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




## Future Scope

1.  **Adaptive Room Architecture**
    
    -   Implement a dynamic room structure that adjusts based on participant load, optimizing performance and resource allocation.
2.  **Dedicated Frontend Server**
    
    -   Develop a separate frontend service to improve scalability and reduce backend server load.
3.  **Improved Security & Encryption**
    
    -   Enhance security by implementing end-to-end encryption for video and chat data.
4.  **Mobile App Support**
    
    -   Expand the service with a dedicated mobile application for iOS and Android.
5.  **Recording & Playback Feature**
    
    -   Introduce an option to record meetings and provide playback functionality for users.
