const express = require('express');
const router = express.Router({
  mergeParams: true
});
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware');

router.get('/new', middleware.isLoggedIn, (req, res) => {
  Campground
    .findById(req.params.id)
    .then(campground => {
      if (!campground) {
        throw new Error('Campground not found!');
      }
      res.render('comments/new', {
        campground
      });
    })
    .catch(err => {
      req.flash('error', 'Campground not found!');
      res.redirect('back');
    });
});

router.post('/', middleware.isLoggedIn, (req, res) => {
  let foundCampground;
  Campground
    .findById(req.params.id)
    .then(campground => {
      foundCampground = campground;
      return Comment.create(req.body.comment);
    })
    .then(comment => {
      // add username and id to comment
      comment.author.id = req.user._id;
      comment.author.username = req.user.username;
      // save the comment
      comment.save();
      foundCampground.comments.push(comment);
      foundCampground.save();
      req.flash('success', 'Successfully added comment!');
      res.redirect(`/campgrounds/${foundCampground._id}`);
    })
    .catch(err => {
      console.log(err);
      res.redirect('/campgrounds');
    });
});

router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) => {
  Campground.findById(req.params.id)
    .then(foundCampground => {
      if (!foundCampground) {
        throw new Error('Campground not found!');
      }
      Comment.findById(req.params.comment_id)
        .then(foundComment => {
          res.render('comments/edit', {
            campground_id: req.params.id,
            campgroundName: foundCampground.name,
            comment: foundComment
          });
        })
        .catch(err => {
          res.redirect('back');
        });
    })
    .catch(err => {
      req.flash('error', 'Campground not found!');
      res.redirect('back');
    });
});

router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
    if (err) {
      res.redirect('back');
    } else {
      res.redirect(`/campgrounds/${req.params.id}`);
    }
  });
});

router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndRemove(req.params.comment_id)
    .then(comment => {
      req.flash('success', 'Comment successfully deleted!');
      res.redirect('back');
    })
    .catch(err => {
      res.redirect(`/campgrounds/${req.params.id}`);
    });
});

module.exports = router;