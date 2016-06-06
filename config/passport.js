var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('../models/user.js');

// serialize and deserialize
passport.serializeUser(function(user, done) {
  // _id created in mongodb
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// middleware

// giving name of local-login to refer to it later
// new instance of LocalStrategy & pass it request fields
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done) {
  // find specific email you just entered
  User.findOne({ email: email }, function(err, user) {
    if (err) return done(err);

    if (!user) {
      return done(null, false, req.flash('loginMessage', 'No user has been found'));
    } else if (!user.comparePassword(password)) {
      return done(null, false, req.flash('loginMessage', 'Incorrect password'));
    } else {
      // found user
      return done(null, user);
    }

  });
}));

// validate
exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}