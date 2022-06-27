const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    googleId: String,
    emailId: String,
    photo: String,
});

const User = mongoose.model("user", userSchema);

module.exports = User