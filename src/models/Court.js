// src/models/Court.js
import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  reservedCourts: { type: Number, default: 0 },
  totalCourts: { type: Number, default: 6 },
  teams: { type: Map, of: String },  //tid:court
  remainUserforEachCourt:{type:Map,of:Number},
  firstChoiceTeams: [{ 
    type: String, 
    // Format: teamId-courtLetter (e.g., "team123-A")
    validate: {
      validator: function(v) {
        return /^[^-]+-[A-F]$/.test(v);
      },
      message: props => `${props.value} is not a valid team-court assignment!`
    }
  }],
  secondChoiceTeams: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return /^[^-]+-[A-F]$/.test(v);
      },
      message: props => `${props.value} is not a valid team-court assignment!`
    }
  }],
  thirdChoiceTeams: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return /^[^-]+-[A-F]$/.test(v);
      },
      message: props => `${props.value} is not a valid team-court assignment!`
    }
  }]
});

// Ensure unique index for date and time slot
courtSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.models.Court || mongoose.model("Court", courtSchema);