import mongoose, { Schema, model } from 'mongoose';

const transactionSchema  = new Schema({
  email: { type: String, ref: 'users', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'order', 'refund'],
    required: true 
  },
  amount: { type: Number, required: true },
  description: String,
  balanceBefore: Number,
  balanceAfter: Number,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'orders' }, 
},{timestamps: true, versionKey: false});

export default model('transactions', transactionSchema );
