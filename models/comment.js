const mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String
    }
  }
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;