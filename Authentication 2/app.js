const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const mongoose = require("mongoose")
const flash = require("connect-flash")
const session = require("express-session");
const passport = require("passport")

const app = express()

require("./config/passport")(passport);

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static("public"))
app.use(express.urlencoded({
    extended: false
}))

app.use(session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.successMsg = req.flash("successMsg");
    res.locals.errorMsg = req.flash("errorMsg");
    res.locals.error = req.flash("error");
    next();
})

mongoose.connect("mongodb://localhost:27017/hackDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
    .catch(() => console.log(err));

app.use("/", require("./routes/index"))
app.use("/users", require("./routes/users"))


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})