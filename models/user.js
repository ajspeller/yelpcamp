const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String
  },
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  avatar: {
    type: String
  },
  password: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;