require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");

require("./config/passport");

const app = express();

/* ===============================
   1️⃣ Basic Middlewares
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   2️⃣ Database Connection
================================ */
const dbConnection =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sdpc";

mongoose
  .connect(dbConnection)
  .then(() => console.log(`MongoDB connected to: ${dbConnection}`))
  .catch((err) => console.error("MongoDB error:", err));

/* ===============================
   3️⃣ Sessions (MUST COME BEFORE PASSPORT)
================================ */
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Render uses HTTPS
    },
  })
);

/* ===============================
   4️⃣ Passport
================================ */
app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   5️⃣ Auth Middleware
================================ */
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login.html");
}

/* ===============================
   6️⃣ Protected Home Route
================================ */
app.get("/", ensureAuth, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* ===============================
   7️⃣ Static Files (AFTER PROTECTION)
================================ */
app.use(express.static("public"));

/* ===============================
   8️⃣ Routes
================================ */
app.use("/auth", require("./routes/googleAuth"));
app.use("/auth", require("./routes/auth"));

// Protect API route too
app.use("/api", ensureAuth, require("./routes/convert"));

/* ===============================
   9️⃣ Start Server
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SDPC Backend running on port ${PORT}`);
});
