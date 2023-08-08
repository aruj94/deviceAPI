import mongoose from "mongoose";

const COLLECTION_NAME = process.env.COLLECTION_NAME;

/**
 * Basic model is setup for the type of data allowed in the mongodb collection.
 * Version keys are set to false hence will not be stored in the document
 */
const errorData = mongoose.Schema({
    data: { type: String, required: true },
}, { versionKey: false });

export default mongoose.model("Error", errorData, COLLECTION_NAME);