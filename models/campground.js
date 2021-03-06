const mongoose = require('mongoose');

const CampgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  imageId: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  lat: {
    type: Number
  },
  lng: {
    type: Number
  },
  price: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: {
      type: String
    }
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

const Campground = mongoose.model('Campground', CampgroundSchema);

module.exports = Campground;