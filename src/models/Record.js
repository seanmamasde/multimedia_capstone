// src/models/Record.js
import mongoose from "mongoose";

const RecordSchema = new mongoose.Schema({
  team: {
    name: String,
    members: [String],
  },
  captain: String,
  date: Date,
  timeSlot: String,
  status: String,
  venue: String,
});

export default mongoose.models.Record || mongoose.model("Record", RecordSchema);
