const passport = require('passport');
const express = require('express');
const User = require('../models/user');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('landing');
});

// show register form
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const newUser = new User({
    username: req.body.username
  })
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
  failureRedirect: '/login'
}), (req, res) => {});

// LOGOUT
router.get('/logout', (req, res) => {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect('/campgrounds');
});

module.exports = router;