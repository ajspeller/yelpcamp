const passport = require('passport');
const express = require('express');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/user');
const Campground = require('../models/campground');

router.get('/', (req, res, next) => {
  res.render('landing');
});

// show register form
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const newUser = new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    avatar: req.body.avatar,
    isAdmin: req.body.adminCode === process.env.YELPCAMP_ADMINCODE ? true : false
  });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      return res.render('register', {
        error: err.message
      });
    }
    passport.authenticate("local")(req, res, function () {
      req.flash('success', `Welcome to YelpCamp ${user.username}`)
      res.redirect('/campgrounds');
    });
  });
});

// LOGIN ROUTES
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', passport.authenticate("local", {
  successRedirect: '/campgrounds',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: 'Login successful!'
}), (req, res) => {});

// LOGOUT
router.get('/logout', (req, res) => {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect('/campgrounds');
});

// PROFILE
router.get('/users/:id', (req, res) => {
  User.findById(req.params.id)
    .then(foundUser => {
      Campground
        .find()
        .where('author.id')
        .equals(foundUser._id)
        .exec()
        .then(campgrounds => {

          console.log(foundUser);
          console.log(res.locals.currentUser);

          res.render('users/show', {
            user: foundUser,
            campgrounds: campgrounds
          });
        });
    })
    .catch(err => {
      req.flash("error", "Unable to retrieve user profile");
      res.redirect('/');
    });
});

// FORGOT PASSWORD
router.get('/forgot', (req, res) => {
  res.render('users/forgot');
});

router.post('/forgot', (req, res, next) => {
  console.log('inside post');
  async.waterfall([
    (done) => {
      console.log('create token');
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      console.log('find user');
      User.findOne({
          email: req.body.email
        })
        .then(user => {
          console.log('user >>>');
          console.log(user);
          if (!user) {
            req.flash('error', 'No account with that email address exists!');
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save((err) => {
            done(err, token, user);
          });
        })
        .catch(err => {
          req.flash('error', 'Error attempting to retrieve user email address');
          return res.redirect('/forgot');
        });
    },
    (token, user, done) => {
      console.log('creating email');
      const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILUSR,
          pass: process.env.GMAILPWD
        }
      });
      const mailOptions = {
        to: user.email,
        from: process.env.GMAILUSR,
        subject: 'Node.js Password Reset',
        text: `You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to comple the process\n\nhttp://${req.headers.host}/reset/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        console.log('mail sent');
        req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
        done(err, 'done');
      });
    }
  ], (err) => {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/forgot');
      }
      res.render('users/reset', {
        token: req.params.token
      });
    })
    .catch(err => {
      req.flash('error', 'Unable to retrieve token');
      return res.redirect('/forgot');
    });
});

router.post('/reset/:token', (req, res) => {
  async.waterfall([
    (done) => {
      User.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: {
            $gt: Date.now()
          }
        })
        .then(user => {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('back');
          }
          if (req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, (err) => {
              user.resetPasswordExpires = undefined;
              user.resetPasswordToken = undefined;

              user.save((err) => {
                req.login(user, (err) => {
                  done(err, user);
                });
              });
            })
          } else {
            req.flash('error', 'Passwords do not match!');
            return res.redirect('back');
          }
        })
    },
    (user, done) => {
      const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILUSR,
          pass: process.env.GMAILPWD
        }
      });
      const mailOptions = {
        to: user.email,
        from: process.env.GMAILUSR,
        subject: 'Your password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed!`
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        console.log('mail sent');
        req.flash('success', `Your password has been changed!`);
        done(err);
      });
    }
  ], (err) => {
    res.redirect('/campgrounds');
  });
});

// EDIT PROFILE
router.get('/users/:id/edit', /* middleware.checkProfileOwnership, */ (req, res) => {
  // Campground.findById(req.params.id)
  //   .then(foundCampground => {
  //     res.render('campgrounds/edit', {
  //       campground: foundCampground
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     res.redirect('/campgrounds');
  //   });
  User.findById(req.params.id)
    .then(user => {
      res.render('users/edit', {
        user
      });
    })
    .catch(err => {})
});

// UPDATE PROFILE
router.put('/users/:id', /* middleware.checkCommentOwnership, */ (req, res) => {

  console.log(req.user);
  console.log()

  User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
    if (err) {
      req.flash('success', 'User profile updated');
      res.redirect('back');
    } else {
      res.redirect(`/users/${req.params.id}`);
    }
  });
});


module.exports = router;