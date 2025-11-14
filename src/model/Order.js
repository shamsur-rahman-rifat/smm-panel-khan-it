import { Schema, model } from 'mongoose';

const orderSchema  = new Schema({
  email: { type: String, ref: 'users', required: true },
  serviceId: { type: Number, required: true },
  serviceName: String,
  link: { type: String, required: true },
  quantity: { type: Number, required: true },
  charge: { type: Number, required: true }, // Amount user paid
  actualCharge: { type: Number, required: true }, // Amount paid to third-party
  profit: { type: Number, required: true }, // Admin profit
  apiOrderId: String,
  refill: { type: Boolean, required: true },
  cancel: { type: Boolean, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Completed', 'Partial', 'Canceled'],
    default: 'Pending' 
  },
  startCount: Number,
  remains: Number,
},{timestamps: true, versionKey: false});

export default model('orders', orderSchema);