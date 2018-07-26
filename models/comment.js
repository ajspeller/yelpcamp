const mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;