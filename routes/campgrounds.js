const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const middleware = require('../middleware');
const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

router.get('/', (req, res) => {

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

router.get('/new', middleware.isLoggedIn, (req, res) => {
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
router.post('/', middleware.isLoggedIn, (req, res) => {
  let newCampground = req.body.campground;
  newCampground.author = {
    id: req.user._id,
    username: req.user.username
  };

  geocoder.geocode(req.body.campground.location)
    .then(data => {
      if (!data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      const lat = data[0].latitude;
      const lng = data[0].longitude;
      const location = data[0].formattedAddress;
      const newCG = {
        ...newCampground,
        location,
        lat,
        lng
      };
      console.log(newCG);
      Campground.create(newCG)
        .then(campground => {
          res.redirect('/campgrounds');
        }).catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
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


  let newCampground = req.body.campground;
  newCampground.author = {
    id: req.user._id,
    username: req.user.username
  };

  geocoder.geocode(req.body.campground.location)
    .then(data => {
      if (!data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      const lat = data[0].latitude;
      const lng = data[0].longitude;
      const location = data[0].formattedAddress;
      const newCG = {
        ...newCampground,
        location,
        lat,
        lng
      };

      // find and update then redirect
      Campground.findByIdAndUpdate(req.params.id, newCG, (err, updatedCampground) => {
        if (err) {
          req.flash('error', err.message);
          res.redirect('/campgrounds');
        } else {
          req.flash('success', 'Successfully Updated!');
          res.redirect(`/campgrounds/${req.params.id}`);
        }
      });
    })
    .catch(err => {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
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