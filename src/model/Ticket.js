import { Schema, model } from 'mongoose';

const ticketSchema = new Schema({
  userEmail: { type: String, required: true, ref: 'users' },
  orderId: { type: Schema.Types.ObjectId, ref: 'orders', default: null },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  replies: [{
    sender: { type: String }, // 'user' or 'admin'
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true, versionKey: false });

export default model('tickets', ticketSchema);