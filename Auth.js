const passport = require('passport');
const ObjectID = require("mongodb").ObjectId;
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, db) {
app.use(passport.initialize());
app.use(passport.session());
  
passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    });
    
    passport.use(
      new LocalStrategy(function(username, password, done) {
        db.collection("users").findOne({ username: username }, function(err, user) {
          console.log("User " + username + " attempted to log in.");
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
          return done(null, user);
        });
      })
    );
   passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://zgleman-advnode.glitch.me/auth/github/callback'
    }, function(accessToken, refreshToken, profile, cb){
      console.log(profile);
      db.collection('socialusers').findAndModify(
      {id: profile.id},
      {},
      {$setOnInsert: {
        id: profile.id,
        name: profile.displayName,
        photo: profile.photos[0].value,
        email: profile.emails[0].value,
        created_on: new Date(),
        provider: profile.provider
      }, $set:{
        last_login: new Date()
      }, $inc:{
        login_count: 1
      }}, {upsert: true, new: true}, (err, doc)=>{return cb(null, doc.value);
                                                 });
    }));
}