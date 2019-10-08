'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const app = express();
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;
const LocalStrategy = require('passport-local');

process.env.SESSION_SECRET = 23.4;
process.env.DATABASE = 'mongodb+srv://zgleman:grey1127@cluster0-2my3z.mongodb.net/test?retryWrites=true&w=majority';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login', showLogin: true});
  });

mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
passport.use(new LocalStrategy(
function(username, password, done){
  db.collection('users').findOne({username: username }, function (err, user) {
    console.log('User '+ username + ' attempted to log in.');
    if (err) { return done(err);}
    if (!user) {return done(null, false);}
    if (password !== user.password) {return done(null, false);}
    return done(null, user);
  });
}));

var ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/');
};      
      
passport.serializeUser((user, done)=>{
  done(null, user._id);
});
passport.deserializeUser((id, done)=>{
  db.collection('users').findOne(
  {_id: new ObjectID(id)},
  (err, doc)=> {
    done(null, doc);
  });
  
});

app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), function(req, res){
  res.redirect('/profile');
});
app.get('/profile', ensureAuthenticated, function(req, res){
   res.render(process.cwd() + '/views/pug/profile');
 });

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
    }});