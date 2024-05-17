import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import UserModel from "../models/userModel";

export default class AuthRepository {
  async createUser(user: DecodedIdToken) {
    const newUser = new UserModel({
      uid: user.uid,
      email: user.email,
      email_verified: user.email_verified,
      phone_number: user.phone_number,
      photo_url: {
        secure_url: user.picture,
      },
    });

    await newUser.save();
    return newUser;
  }

  async getUserById(uid: string) {
    return await UserModel.findOne({ uid: uid });
  }
}
