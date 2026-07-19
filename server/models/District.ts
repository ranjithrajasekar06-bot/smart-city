import mongoose from "mongoose";

export interface IDistrict extends mongoose.Document {
  districtName: string;
  taluks: string[];
}

const districtSchema = new mongoose.Schema({
  districtName: {
    type: String,
    required: true,
    unique: true,
  },
  taluks: {
    type: [String],
    default: [],
  }
});

export default mongoose.model<IDistrict>("District", districtSchema);
