const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  formId: String,
  formUrl: String,
  mcqText: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("History", historySchema);
