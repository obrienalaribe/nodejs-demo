const mongoose = require("mongoose");

// Define the schema for records
const recordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

// Create and export the model
module.exports = mongoose.model("Record", recordSchema);
