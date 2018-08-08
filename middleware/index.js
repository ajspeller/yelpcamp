const Campground = require('../models/campground');
const Comment = require('../models/comment');

const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id)
      .then(foundCampground => {
        if (foundCampground.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash('error', 'You did not have permission to complete that operation!');
          res.redirect('back');
        }
      })
      .catch(err => {
        req.flash('error', 'Campground not found!');
        res.redirect('back');
      });
  } else {
    req.flash('error', 'You must be logged in to complete that operation!')
    res.redirect('back');
  }
}

middlewareObj.checkCommentOwnership = (req, res, next) => {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id)
      .then(foundComment => {
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash('error', 'You did not have permission to complete that operation!');
          res.redirect('back');
        }
      })
      .catch(err => {
        req.flash('error', 'Comment not found!');
        res.redirect('back');
      });
  } else {
    req.flash('error', 'You must be logged in to complete that operation!')
    res.redirect('back');
  }
}
middlewareObj.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', "Please login first!");
  res.redirect('/login');
};

module.exports = middlewareObj