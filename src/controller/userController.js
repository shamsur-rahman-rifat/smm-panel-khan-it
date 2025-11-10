// userController.js (ES Module)

import userModel from '../model/User.js';
import transactionModel from '../model/Transaction.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utility/sendEmail.js';
import OTPModel from '../model/OTP.js';

export const registration = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'Failed', message: 'Email already in use' });
    }

    await userModel.create(req.body);
    res.json({ status: 'Success', message: 'Registration Completed' });
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const reqBody = req.body;
    const user = await userModel.find(reqBody);
    if (user.length > 0) {
      const PayLoad = {
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 * 3,
        data: reqBody.email,
        userId: user._id
      };
      const token = jwt.sign(PayLoad, process.env.JWT_SECRET);
      res.json({ status: 'Success', message: 'User Found', token });
    } else {
      res.json({ status: 'Failed', message: 'User not found' });
    }
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await userModel.find({ email });

    if (user.length > 0) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      await sendEmail(email, `Your PIN is = ${otp}`, 'SMM Panel Code');
      await OTPModel.create({ email, otp, status: 'Active' });
      res.json({ status: 'Success', message: 'OTP Sent' });
    } else {
      res.json({ status: 'Failed', message: 'No User Found' });
    }
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.params;
    const user = await OTPModel.find({ email, otp, status: 'Active' });

    if (user.length > 0) {
      await OTPModel.updateOne({ email, otp }, { status: 'Verified' });
      res.json({ status: 'Success', message: 'Code Verified' });
    } else {
      res.json({ status: 'Failed', message: 'Invalid Code' });
    }
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const passwordReset = async (req, res) => {
  try {
    const { email, otp, password } = req.params;
    const user = await OTPModel.find({ email, otp, status: 'Verified' });

    if (user.length > 0) {
      await OTPModel.deleteOne({ email, otp });
      await userModel.updateOne({ email }, { password });
      res.json({ status: 'Success', message: 'Password Updated' });
    } else {
      res.json({ status: 'Failed', message: 'Invalid Request' });
    }
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const profileUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const reqBody = req.body;
    await userModel.updateOne({  _id: id }, reqBody);
    res.json({ status: 'Success', message: 'Profile Updated' });
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const profileDelete = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.deleteOne({ _id: id });
    res.json({ status: 'Success', message: 'Profile Deleted' });
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const profileDetails = async (req, res) => {
  try {
    const email = req.headers['email'];
    const result = await userModel.find({ email });
    res.json({ status: 'Success', data: result });
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const viewUserList = async (req, res) => {
  try {
    const result = await userModel.find();
    res.json({ status: 'Success', data: result });
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};

export const viewTransactionHistory = async (req, res) => {
  try {
    const email = req.headers['email'];
    const result = await transactionModel.find({ email })

    if (result.length === 0) {
      return res.json({ status: 'Failed', message: 'No transactions found for this user' });
    }

    res.json({ status: 'Success', data: result });
  } catch (error) {
    res.json({ status: 'Failed', message: error.message });
  }
};

