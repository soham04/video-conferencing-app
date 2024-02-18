import mongoose, { Document, Model } from "mongoose";

export interface UserDocument extends Document {
    name: string;
    email: string;
    googleId: string;
    emailId: string;
    photo: string;
}

const userSchema = new mongoose.Schema<UserDocument>({
    name: String,
    email: String,
    googleId: String,
    emailId: String,
    photo: String,
});

export const User: Model<UserDocument> = mongoose.model<UserDocument>("User", userSchema);
