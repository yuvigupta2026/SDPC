const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/forms.body"
    ],
    accessType: "offline",
    prompt: "consent"
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.send("Google Auth Successful. You can now use /api/convert");
  }
);

module.exports = router;
