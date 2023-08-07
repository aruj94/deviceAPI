import mongoose from "mongoose";

const COLLECTION_NAME = process.env.COLLECTION_NAME;

const errorData = mongoose.Schema({
    data: { type: String, required: true },
}, { versionKey: false });

export default mongoose.model("Error", errorData, COLLECTION_NAME);