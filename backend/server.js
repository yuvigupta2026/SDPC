require("dotenv").config();

const session = require("express-session");
const passport = require("passport");
require("./config/passport");

// 1. Load environment variables
require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// 2. Middlewares
app.use(cors());
app.use(express.json());

// 3. Database connection
const dbConnection = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sdpc";

mongoose
  .connect(dbConnection)
  .then(() => console.log(`MongoDB connected to: ${dbConnection}`))
  .catch(err => console.error("MongoDB error:", err));

// 4. Routes
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login.html");
}
app.use(express.static("public"));

app.get("/", ensureAuth, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true
  }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", require("./routes/googleAuth"));
app.use("/auth", require("./routes/auth"));        // ✅ NEW (Multi-user login)
app.use("/api", require("./routes/convert"));     // Convert route (protected later)
// app.use("/", require("./routes/googleAuth"));     // Google OAuth temporarily removed

// 5. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SDPC Backend running on port ${PORT}`);
});
