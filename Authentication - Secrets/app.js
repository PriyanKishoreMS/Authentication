require("dotenv").config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret: "keyboard cat and mouse mouse",
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userdb", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    githubId: String,
    secret: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/github/secrets"
    },
    function(accessToken, refreshToken, profile, done) {
        // console.log(profile);
        User.findOrCreate({ githubId: profile.id }, function(err, user) {
            return done(err, user);
        });
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/secrets');
    });

app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/secrets',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/secrets');
    });

app.get("/", (req, res) => {
    res.render("home")
})

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post(passport.authenticate("local"), (req, res) => {
        res.redirect("/secrets");
    });

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                })
            }
        })
    });

app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            User.findById(req.user.id, (err, foundUser) => {
                if (foundUser) {
                    res.render("submit", { secrets: foundUser.secret })
                }
            })
        } else {
            res.redirect("/login");
        }
    })
    .post((req, res) => {
        const submittedSecret = req.body.secret;
        // console.log(req.user.id)

        if (req.isAuthenticated()) {
            User.findById(req.user.id, (err, foundUser) => {
                foundUser.secret.push(submittedSecret);
                foundUser.save(() => {
                    res.redirect("/secrets");
                })
            })
        } else {
            res.redirect("/login");
        }
    });

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null } }, (err, foundUser) => {
            if (!err) {
                if (foundUser) {
                    res.render("secrets", { usersWithSecret: foundUser });
                } else {
                    console.log(err)
                }
            } else {
                console.log(err);
            }
        })
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})

app.post("/submit/delete", function(req, res) {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, function(err, foundUser) {
            foundUser.secret.splice(foundUser.secret.indexOf(req.body.secret), 1);
            foundUser.save(function(err) {
                if (!err) {
                    res.redirect("/submit");
                }
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at port 3000");
})