import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  reservedCourts: { type: Number, default: 0 },
  totalCourts: { type: Number, default: 6 },
  firstChoiceTeams: [{ type: String }], // Array for first-choice team IDs
  secondChoiceTeams: [{ type: String }], // Array for second-choice team IDs
  thirdChoiceTeams: [{ type: String }], // Array for third-choice team IDs
});

courtSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.models.Court || mongoose.model("Court", courtSchema);
