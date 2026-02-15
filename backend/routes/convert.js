const History = require("../models/history");
const auth = require("../middleware/authMiddleware");
const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

router.post("/convert", auth, async (req, res) => {
  try {
    if (!global.authClient) {
      return res.status(401).json({ error: "Google not authenticated" });
    }

    const mcqText = req.body.mcqText;
    const questions = parseMCQ(mcqText);

    const forms = google.forms({
      version: "v1",
      auth: global.authClient
    });

    // 1️⃣ Create Google Form
    const form = await forms.forms.create({
      requestBody: {
        info: {
          title: "SDPC Generated MCQ Form"
        }
      }
    });

    const formId = form.data.formId;

    // 2️⃣ Add MCQ Questions
    let requests = [];

    questions.forEach((q, index) => {
      requests.push({
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
      });
    });

    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests }
    });

    // 3️⃣ Save History AFTER success
    await History.create({
      userId: req.user.id,
      formId,
      formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      mcqText
    });

    res.json({
      formUrl: `https://docs.google.com/forms/d/${formId}/viewform`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Form creation failed" });
  }
});

// 🔹 Simple MCQ parser
function parseMCQ(text) {
  const blocks = text.trim().split("\n\n");

  return blocks.map(block => {
    const lines = block.split("\n");
    const question = lines[0];
    const options = lines.slice(1).filter(l => l.trim());

    return {
      question,
      options
    };
  });
}

module.exports = router;
