const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, db) {
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/");
    };
    
  
    app.route("/").get((req, res) => {
      res.render(process.cwd() + "/views/pug/index.pug", {
        title: "Home Page",
        message: "Please login",
        showLogin: true,
        showRegistration: true
      });
    });

    app.route("/profile").get(ensureAuthenticated, function(req, res) {
      res.render(process.cwd() + "/views/pug/profile", {
        username: req.user.username
      });
    });
    app.route("/login")
       .post(passport.authenticate("local", { failureRedirect: "/" }), function(req, res) {
        res.redirect("/profile");
      });
    
    app.route("/register")
      .post(function(req, res, next) {
        db.collection("users").findOne(
          { username: req.body.username },
          function(err, user) {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect("/");
            } else {
              var hash = bcrypt.hashSync(req.body.password, 12);
              db.collection("users").insertOne(
                {
                  username: req.body.username,
                  password: hash
                },
                (err, doc) => {
                  if (err) {
                    res.redirect("/");
                  } else {
                    next(null, user);
                  }
                }
              );
            }
          }
        );
      },
      passport.authenticate("local", { failureRedirect: "/" }), function(req, res, next) {
        res.redirect("/profile");
      });
  
    

    app.get("/logout", function(req, res) {
      req.logout();
      res.redirect("/");
    });

    app.use((req, res, next) => {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

}