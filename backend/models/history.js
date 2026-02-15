const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true   // 🚀 Faster history lookup
    },
    formId: String,
    formUrl: String,
    mcqText: String
  },
  { timestamps: true }  // 👈 auto adds createdAt & updatedAt
);

module.exports = mongoose.model("History", historySchema);
