const History = require("../models/history");
const auth = require("../middleware/authMiddleware");
const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

router.post("/convert", auth, async (req, res) => {
  try {
    console.log("🔎 User:", req.user);

    // 1️⃣ Check Google Auth
    if (!global.authClient) {
      return res.status(401).json({ error: "Google not authenticated" });
    }

    // 2️⃣ Validate Input
    if (!req.body.mcqText) {
      return res.status(400).json({ error: "MCQ text is required" });
    }

    const questions = parseMCQ(req.body.mcqText);

    if (!questions.length) {
      return res.status(400).json({ error: "No valid questions found" });
    }

    const forms = google.forms({
      version: "v1",
      auth: global.authClient
    });

    // 3️⃣ Create Google Form
    const form = await forms.forms.create({
      requestBody: {
        info: {
          title: "SDPC Generated MCQ Form"
        }
      }
    });

    const formId = form.data.formId;

    console.log("✅ Form Created:", formId);

    // 4️⃣ Add Questions
    const requests = questions.map((q, index) => ({
      createItem: {
        item: {
          title: q.question,
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: "RADIO",
                options: q.options.map(opt => ({
                  value: opt
                }))
              }
            }
          }
        },
        location: { index }
      }
    }));

    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests }
    });

    console.log("✅ Questions Added");

    // 5️⃣ Save History
    await History.create({
      userId: req.user?.id,
      formId,
      formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      mcqText: req.body.mcqText
    });

    console.log("✅ History Saved");

    // 6️⃣ Send Response
    res.json({
      formUrl: `https://docs.google.com/forms/d/${formId}/viewform`
    });

  } catch (err) {

    console.error("❌ FULL ERROR:");
    console.error(err.response?.data || err.message || err);

    res.status(500).json({
      error: err.response?.data || err.message || "Form creation failed"
    });
  }
});

// 🔹 Improved MCQ parser
function parseMCQ(text) {
  const blocks = text
    .split(/\n\s*\n/)       // split by blank lines
    .map(b => b.trim())
    .filter(b => b);

  return blocks.map(block => {
    const lines = block
      .split("\n")
      .map(l => l.trim())
      .filter(l => l);

    return {
      question: lines[0],
      options: lines.slice(1)
    };
  }).filter(q => q.question && q.options.length > 0);
}

module.exports = router;
