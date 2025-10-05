import UserModel from '../model/User.js';
import axios from 'axios';

// Get your SSLCOMMERZ API credentials from environment variables
const storeID = process.env.SSL_STORE_ID;
const storePassword = process.env.SSL_STORE_PASSWORD;
const sslCommerzUrl = 'https://sandbox.sslcommerz.com/gwprocess/v4/orderlink'; // Use production URL for live transactions

// Payment Initiation Endpoint
export const initiatePayment = async (req, res) => {
  try {
    const { amount, email } = req.body; // Amount to add to user's credits and user's email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'Failed', message: 'User not found' });
    }

    // Prepare the data to be sent to SSLCOMMERZ API
    const paymentData = {
      store_id: storeID,
      store_passwd: storePassword,
      total_amount: amount,
      currency: 'BDT', // Choose the currency. 
      tran_id: `TXN${Date.now()}`, // Unique Transaction ID
      success_url: 'https://yourwebsite.com/payment-success', // Define the success URL
      fail_url: 'https://yourwebsite.com/payment-fail', // Define the fail URL
      cancel_url: 'https://yourwebsite.com/payment-cancel', // Define the cancel URL
      product_name: 'Credit Purchase',
      product_category: 'Credits',
      user_email: email,
      // You can add more custom data here if needed
    };

    // Send the payment data to SSLCOMMERZ to generate an order link
    const response = await axios.post(sslCommerzUrl, paymentData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.status === 'SUCCESS') {
      // Redirect the user to the SSLCOMMERZ payment page
      res.json({
        status: 'Success',
        payment_url: response.data.payment_url
      });
    } else {
      return res.status(400).json({ status: 'Failed', message: 'Failed to initiate payment' });
    }
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

// Payment verification callback from SSLCOMMERZ (after success/failure)
export const verifyPayment = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;

    if (status === 'VALID') {
      // Get transaction details from SSLCOMMERZ API
      const verificationData = {
        store_id: storeID,
        store_passwd: storePassword,
        tran_id,
      };

      const verifyUrl = 'https://sandbox.sslcommerz.com/gwprocess/v4/verificationquery';
      const verificationResponse = await axios.post(verifyUrl, verificationData);

      if (verificationResponse.data && verificationResponse.data.status === 'SUCCESS') {
        // Add credits to the user’s account
        const { email, amount } = verificationResponse.data;

        const user = await UserModel.findOne({ email });
        if (user) {
          user.credits += amount; // Add credits (amount can be fetched from SSLCOMMERZ response)
          await user.save();
          
          res.json({
            status: 'Success',
            message: 'Payment verified and credits added successfully',
          });
        } else {
          res.status(404).json({ status: 'Failed', message: 'User not found' });
        }
      } else {
        res.status(400).json({ status: 'Failed', message: 'Payment verification failed' });
      }
    } else {
      res.status(400).json({ status: 'Failed', message: 'Payment not valid' });
    }
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};