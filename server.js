require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const bodyParser = require("body-parser");
const passport = require("./passport");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
var io = require('./socket.io')
io(server) // setting up socket server

app.set("view engine", "ejs");
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // in milliseconds value = 1 day
    keys: ["cokiekey"],
  }));
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(require("./routes/routes"))

async function main() {
  await mongoose.connect(process.env.MONGO_DB_LINK);
  console.log("Connected to mongoDB");
}

main().catch((err) => console.log(err));

// ! LISTENING ON THE PORT FOR REQUESTS
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express server listening on port ${port} | GOTO http://localhost:${port}/`);
});
