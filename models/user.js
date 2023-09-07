import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    number: {
      type: String,
    },
  },
  { versionKey: false }
);

const User = model("User", userSchema);
export default User;
