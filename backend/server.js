const History = require("./models/history");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo").default;
const cookieParser = require("cookie-parser");

require("./config/passport");

const app = express();

/* ===============================
   1️⃣ Basic Middlewares
================================ */

// TRUST RENDER PROXY
app.set("trust proxy", 1);

// CORS (ONLY ONCE)
app.use(
  cors({
    origin: "https://sdpc-klnt.onrender.com",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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
   3️⃣ Sessions (BEFORE PASSPORT)
================================ */

app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // important
      httpOnly: true,
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
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

app.get("/login.html", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.sendFile(__dirname + "/public/login.html");
});

/* ===============================
   6️⃣ Protected Routes
================================ */

app.get("/", ensureAuth, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/history.html", ensureAuth, (req, res) => {
  res.sendFile(__dirname + "/public/history.html");
});

app.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      name: req.user.displayName,
      email: req.user.emails?.[0]?.value,
    });
  }
  res.status(401).json({ message: "Not logged in" });
});

/* ===============================
   7️⃣ Static Files
================================ */

app.use(express.static("public"));

/* ===============================
   8️⃣ Auth & API Routes
================================ */

app.use("/auth", require("./routes/googleAuth"));
app.use("/auth", require("./routes/auth"));

app.use("/api", ensureAuth, require("./routes/convert"));

app.get("/api/history", ensureAuth, async (req, res) => {
  try {
    const history = await History.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch history",
    });
  }
});

/* ===============================
   9️⃣ Start Server
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SDPC Backend running on port ${PORT}`);
});
