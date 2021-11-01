const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

const User = require("../model/User")

router.get("/login", (req, res) =>
    res.render("login")
);

router.get("/register", (req, res) =>
    res.render("register")
);

router.post("/register", (req, res) => {
    const { name, email, mobile, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !mobile || !password2) {
        errors.push({msg: "Please fill in all the fields"})
    }

    if (password != password2) {
        errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
        errors.push({msg: "Password should be atleast 6 characters"})
    }

    if (errors.length > 0) {
        res.render("register", {
            errors,
            name,
            mobile,
            email,
            password,
            password2
        });
    } else {
        User.findOne({ email: email })
        .then(user => {
            if (user) {
                errors.push({msg: "Email is already Registered"})
                res.render("register", {
                    errors,
                    name,
                    mobile,
                    email,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name,
                    mobile,
                    email,
                    password
                });

                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;

                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                req.flash("successMsg", "You have been registered successfully, please log in")
                                res.redirect("/users/login")
                            })
                            .catch(err => console.log(err));
                }))
            }
        })
    }
})

router.post("/login", (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: "/dashboard",
        failureRedirect: "/users/login",
        failureFlash: true
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    req.logout();
    req.flash("successMsg", "You are Logged Out Successfully");
    res.redirect("/users/login")
})

module.exports = router;
