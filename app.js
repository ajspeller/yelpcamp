const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds');
const commentRoutes = require('./routes/comments');
const authRoutes = require('./routes/auth');

mongoose.connect(process.env.YELPCAMP_DATABASEURL, {
    useNewUrlParser: true
  })
  .then(() => console.log('Database connections successful'))
  .catch((err) => console.log('Database connection failed', JSON.stringify(undefined, err, 2)));

const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require('express-session')({
  secret: process.env.DEV_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);
app.use('/', authRoutes);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} ...`);
});