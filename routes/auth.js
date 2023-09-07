import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import twilio from "twilio";

const authRouter = express.Router();

// Replace these with your actual Twilio Account SID and Auth Token
const accountSid = process.env.ACCOUNT_SID; //"PUT YOUR ACCOUNT SID HERE"
const authToken = process.env.AUTHTOKEN; //"PUT YOUR AUTH TOKEN HERE"

const client = twilio(accountSid, authToken);

let OTP, user;

authRouter.post("/signup", async (req, res) => {
  try {
    const { username, number } = req.body;

    const existingUser = await User.findOne({ number });

    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({ username, number });

    let digits = "0123456789";
    OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    await client.messages
      .create({
        body: `Your OTP is ${OTP}`,
        // messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        from:process.env.PHONE, //"PUT YOUR TWILIO NUMBER HERE",
        to: number,
      })
      .then(() => res.status(200).json({ msg: "OTP sent" }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post("/signup/verify", async (req, res) => {
  try {
    console.log(req.body);
    const { otp } = req.body;

    if (otp == OTP) {
      const newUser = await user.save();
      const accessToken = jwt.sign({ id: newUser._id },process.env.JWT_SECRET || "secret");
      res.status(200).json({ accessToken, ...newUser._doc });
    } else {
      res.status(400).json({ msg: "Incorrect OTP" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let signinUser;
authRouter.post("/signin", async (req, res) => {
  try {
    const { number } = req.body;
    signinUser = await User.findOne({ number });
    if (!signinUser) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    let digits = "0123456789";
    OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    await client.messages
      .create({
        body: `Your verification OTP for user ${signinUser.username} is ${OTP}`,
        from: process.env.PHONE, //"PUT YOUR TWILIO NUMBER HERE",
        to: number,
      })
      .then(() => res.status(200).json({ msg: "OTP sent" }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.post("/signin/verify", async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp != OTP) {
      return res.status(400).json({ msg: "Incorrect OTP" });
    }
    const token = jwt.sign({ id: signinUser._id }, process.env.JWT_SECRET || "secret");
    res.status(200).json({ token, ...signinUser._doc });
    OTP = "";
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default authRouter;
