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

const multer = require('multer');
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = (req, file, cb) => {
  // accept only image files
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFilter
});

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// SHOW ALL CAMPGROUNDS
router.get('/', (req, res) => {
  let query;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    query = {
      "name": regex
    };
  } else {
    query = {}
  }

  Campground.find(query)
    .then(campgrounds => {
      res.render('campgrounds/index', {
        campgrounds,
        // currentUser: req.user,
        search: req.query.search
      });
    }).catch(err => {
      req.flash('error', 'Error retrieving campground');
      res.redirect('back');
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
      req.flash('error', 'Error retrieving campground');
      res.redirect('back');
    });
});

// CREATE NEW CAMPGROUND ROUTE
router.post('/', middleware.isLoggedIn, upload.single('campground[image]'), (req, res) => {
  console.log(req.body);
  const newCampground = req.body.campground;

  // GEOCODE LOCATION
  geocoder.geocode(newCampground.location)
    .then(data => {

      if (!data.length) {
        req.flash('error', 'Unable to GeoCode the campground location');
        return res.redirect('back');
      }

      newCampground.lat = data[0].latitude;
      newCampground.lng = data[0].longitude;
      newCampground.location = data[0].formattedAddress;

      // UPLOAD IMAGE
      cloudinary.v2.uploader.upload(req.file.path, (err, result) => {

        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        newCampground.imageId = result.public_id;
        newCampground.image = result.secure_url;

        newCampground.author = {
          id: req.user._id,
          username: req.user.username
        };

        Campground.create(newCampground)
          .then(campground => {
            req.flash('success', `Successfully created ${newCampground.name}!`);
            return res.redirect(`/campgrounds/${campground.id}`);
          }).catch(err => {
            console.log(err);
            req.flash('error', 'Error creating new campground');
            return res.redirect('back');
          });

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
router.put('/:id', middleware.checkCampgroundOwnership, upload.single('campground[image]'), (req, res) => {

  const newCampground = req.body.campground;

  geocoder.geocode(req.body.campground.location)
    .then(data => {
      if (!data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }

      Campground.findById(req.params.id)
        .then(async foundCampground => {

          if (req.file) {
            try {
              await cloudinary.v2.uploader.destroy(foundCampground.imageId);
              const result = await cloudinary.v2.uploader.upload(req.file.path)
              foundCampground.imageId = result.public_id;
              foundCampground.image = result.secure_url;
            } catch (err) {
              req.flash('error', err.message);
              return res.redirect('back');
            }
          }

          foundCampground.name = newCampground.name;
          foundCampground.description = newCampground.description;
          foundCampground.price = newCampground.price;
          foundCampground.location = newCampground.location;

          foundCampground.lat = data[0].latitude;
          foundCampground.lng = data[0].longitude;
          foundCampground.location = data[0].formattedAddress;

          try {
            await foundCampground.save()
            req.flash('success', 'Successfully Updated!');
            return res.redirect(`/campgrounds/${req.params.id}`);
          } catch (err) {
            req.flash('error', err.message);
            return res.redirect('/campgrounds');
          }

        })
        .catch((err) => {
          req.flash('error', err.message);
          return res.redirect('/campgrounds');
        });

    })
    .catch(err => {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    });
});

// DELETE A CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, async (req, res) => {

  try {
    const campground = await Campground.findByIdAndRemove(req.params.id);
    await cloudinary.v2.uploader.destroy(campground.imageId);
    req.flash('success', 'Success, campground deleted!');
    return res.redirect('/campgrounds');
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect('/campgrounds');
  }

});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;