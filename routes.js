var express = require("express");
var passport = require("passport");

var User = require("./models/user");

var router = express.Router();

router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});

router.get("/", function (req, res, next) {
    User.find()
        .sort({ createdAt: "descending" })
        .exec(function (err, users) {
            if (err) { return next(err) }
            res.render("index", { users: users });
        });
});

router.get("/signup", function (req, res) {
    res.render("signup");
});

router.post("/signup", function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    User.findOne({ username: username }, function (err, user) {
        if (err) { return next(err) }
        if (user) {
            req.flash("error", "User already exist.")
            return res.redirect("signup");
        }
        var newUser = new User({
            username: username,
            password: password
        });
        newUser.save(next);
    });
}, passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true
}));

router.get("/users/:username", function (req, res, next) {
    User.findOne({ username: req.params.username }, function (err, user) {
        if (err) { return next(err); }
        if (!user) { return next(404); }
        res.render("profile", { user: user });
    });
});

router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function (req, res) {
    // terminate a login session. Invoking logout() will remove the req.user property 
    // and clear the login session (if any).
    req.logout();
    res.redirect("/");
});

// every view now have access to currentUser, which pull from req.user, 
// which is populated by password
router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.info = req.flash("info");
    next();
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("info", "You must be logged in to see this page!");
        res.redirect("/login");
    }
};

// ensure user has been authenticated, then run request handler 
// if user has't been redirected
router.get("/edit", ensureAuthenticated, function (req, res) {
    res.render("edit");
});

// normally will be a PUT request
router.post("/edit", ensureAuthenticated, function (req, res, next) {
    req.user.displayName = req.body.displayname;
    req.user.bio = req.body.bio;
    req.user.save(function (err) {
        if (err) {
            next(err);
            return;
        }
        req.flash("info", "Profile updated!");
        res.redirect("/edit");
    });
});


module.exports = router;