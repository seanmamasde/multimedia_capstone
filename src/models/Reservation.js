import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  teamId: { type: String, required: true },
  preferences: {
    first: { type: String, required: true },
    second: { type: String },
    third: { type: String },
  },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Reservation = mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
