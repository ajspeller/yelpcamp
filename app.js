const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const Comment = require('./models/comment');
const User = require('./models/user');
const seedDB = require('./seeds');

seedDB();

mongoose.connect('mongodb://ajspeller:ajspeller1@ds021299.mlab.com:21299/ajs-yelpcamp', {
    useNewUrlParser: true
  })
  .then(() => console.log('Database connections successful'))
  .catch((err) => console.log('Database connection failed', JSON.stringify(undefined, err, 2)));

const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res, next) => {
  res.render('landing');
});

app.get('/campgrounds', (req, res, next) => {

  Campground.find({})
    .then(campgrounds => {
      res.render('campgrounds/index', {
        campgrounds
      });
    }).catch(err => {
      console.log(err);
    });

});

app.get('/campgrounds/new', (req, res, next) => {
  res.render('campgrounds/new');
});

app.get('/campgrounds/:id', (req, res, next) => {
  const id = req.params.id;
  Campground
    .findById(id)
    .populate("comments")
    .exec()
    .then(campground => {
      res.render('campgrounds/show', {
        campground
      });
    })
    .catch(err => console.log(err));
});

app.post('/campgrounds', (req, res, next) => {
  Campground.create(req.body.campground)
    .then(campground => {
      res.redirect('/campgrounds');
    }).catch(err => {
      console.log(err);
    });
});

// =====================
// COMMENTS ROUTES
// =====================

app.get('/campgrounds/:id/comments/new', (req, res, next) => {
  Campground
    .findById(req.params.id)
    .then(campground => res.render('comments/new', {
      campground
    }))
    .catch(err => console.log(err));
});

app.post('/campgrounds/:id/comments', (req, res, next) => {
  let foundCampground;
  Campground
    .findById(req.params.id)
    .then(campground => {
      foundCampground = campground;
      return Comment.create(req.body.comment);
    })
    .then(comment => {
      foundCampground.comments.push(comment);
      foundCampground.save();
      res.redirect(`/campgrounds/${foundCampground._id}`);
    })
    .catch(err => {
      console.log(err);
      res.redirect('/campgrounds');
    });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} ...`);
})