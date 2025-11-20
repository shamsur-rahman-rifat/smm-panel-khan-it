import User from "../model/User.js";
import Transaction from "../model/Transaction.js";
import axios from "axios";

const NAGORIK_API_KEY = process.env.NAGORIKPAY_API_KEY;
const NAGORIK_CREATE_URL = "https://secure-pay.nagorikpay.com/api/payment/create";
const NAGORIK_VERIFY_URL = "https://secure-pay.nagorikpay.com/api/payment/verify";

// SUCCESS page on your frontend  
const SUCCESS_URL = "https://smm-panel-pi.vercel.app/payment-success";
// CANCEL page  
const CANCEL_URL = "https://smm-panel-pi.vercel.app/payment-cancel";


/* ---------------------------------------------
   1️⃣  Initiate Payment — Returns payment_url
--------------------------------------------- */
export const initiatePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const email = req.headers["email"];

    if (!amount || amount < 10) {
      return res.status(400).json({ status: "Failed", message: "Minimum amount is 10 BDT" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "Failed", message: "User not found" });
    }

    // Payload for NagorikPay
    const data = {
      cus_name: user.name || "Customer",
      cus_email: email,
      amount: String(amount),
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        userId: user._id.toString(),
        email
      }
    };

    const response = await axios.post(NAGORIK_CREATE_URL, data, {
      headers: {
        "API-KEY": NAGORIK_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.data.status) {
      return res.status(400).json({
        status: "Failed",
        message: response.data.message || "Payment initiation failed",
      });
    }

    res.json({
      status: "Success",
      payment_url: response.data.payment_url,
    });

  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};



/* ------------------------------------------------
   2️⃣  Verify Payment (User redirected here)
   NagorikPay redirects to:
   success_url?transactionId=xxx&status=success
------------------------------------------------- */
export const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.query; // NagorikPay returns this

    if (!transactionId) {
      return res.status(400).json({ status: "Failed", message: "Missing transactionId" });
    }

    // Verify with NagorikPay
    const verifyResponse = await axios.post(
      NAGORIK_VERIFY_URL,
      { transaction_id: transactionId },
      {
        headers: {
          "API-KEY": NAGORIK_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const data = verifyResponse.data;

    if (!data || data.status !== "COMPLETED") {
      return res.status(400).json({
        status: "Failed",
        message: "Payment not completed yet",
        data,
      });
    }

    // Extract payment details
    const email = data.cus_email;
    const amount = parseFloat(data.amount);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "Failed", message: "User not found" });
    }

    const balanceBefore = user.balance;
    user.balance += amount/125;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      email,
      type: "deposit",
      amount,
      balanceBefore,
      balanceAfter: user.balance,
      transactionId,
      description: "Wallet Refill"
    });

    await transaction.save();

    res.json({
      status: "Success",
      message: "Payment verified successfully",
      newBalance: user.balance,
      transactionId
    });

  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};