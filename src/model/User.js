import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true , unique: true },
  password: String,
  balance: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  role: { type:String, enum: ['admin', 'user'], default:'user'}  
},{timestamps: true, versionKey: false});

export default model('users', userSchema);
