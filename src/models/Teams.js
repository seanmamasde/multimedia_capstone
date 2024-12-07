//src/models/Teams.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const uuidValidator = {
  validator: function (v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  },
  message: (props) => `${props.value} is not a valid UUID!`,
};

const teamSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    validate: uuidValidator,
  },
  teamname: {type: String, required: true },
  memberNum: { type: Number, required: true },
  uname1: { type: String, default: null },
  uname2: { type: String, default: null },
  uname3: { type: String, default: null },
  uname4: { type: String, default: null }
});

export default mongoose.models.Teams || mongoose.model("Teams", teamSchema);
