import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    uid: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      default: "",
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    photo_url: {
      type: {
        secure_url: String,
        public_id: String,
        mime_type: String,
        uploaded_type: {
          type: String,
          enum: ["url", "cloud"],
          default: "url",
        },
      },
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("users", schema);

export default UserModel;
