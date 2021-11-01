module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash("errorMsg", "Please log in to view");
        res.redirect("/users/login");
    }
}