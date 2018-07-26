const mongoose = require('mongoose');

const campgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

const Campground = mongoose.model('Campground', campgroundSchema);

module.exports = Campground;