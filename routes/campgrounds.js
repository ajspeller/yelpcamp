const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const middleware = require('../middleware');

router.get('/', (req, res, next) => {

  Campground.find({})
    .then(campgrounds => {
      res.render('campgrounds/index', {
        campgrounds,
        currentUser: req.user
      });
    }).catch(err => {
      console.log(err);
    });

});

router.get('/new', middleware.isLoggedIn, (req, res, next) => {
  res.render('campgrounds/new');
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  Campground
    .findById(id)
    .populate("comments")
    .exec()
    .then(campground => {
      if (!campground) {
        throw new Error('Campground not found!')
      }
      res.render('campgrounds/show', {
        campground
      });
    })
    .catch(err => {
      req.flash('error', 'Campground not found!');
      res.redirect('back');
    });
});

// CREATE NEW CAMPGROUND ROUTE

router.post('/', middleware.isLoggedIn, (req, res, next) => {
  let newCampground = req.body.campground;
  newCampground.author = {
    id: req.user._id,
    username: req.user.username
  };
  Campground.create(newCampground)
    .then(campground => {
      res.redirect('/campgrounds');
    }).catch(err => {
      console.log(err);
    });
});

// EDIT CAMPGROUND ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findById(req.params.id)
    .then(foundCampground => {
      res.render('campgrounds/edit', {
        campground: foundCampground
      });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/campgrounds');
    });
});

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, (req, res) => {
  // find and update then redirect
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) => {
    if (err) {
      res.redirect('/campgrounds');
    } else {
      res.redirect(`/campgrounds/${req.params.id}`);
    }
  });
});

// DELETE A CAMPGROUND ROUTE

router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findByIdAndRemove(req.params.id)
    .then(campground => {
      res.redirect('/campgrounds');
    })
    .catch(err => {
      res.redirect('/campgrounds');
    });
});

module.exports = router;