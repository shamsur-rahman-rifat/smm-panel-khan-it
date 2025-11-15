import mongoose from "mongoose";

const RefillSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    apiOrderId: { type: String, required: true },
    refillId: { type: String, required: true },
    status: { type: String, default: "Pending" }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('refills', RefillSchema);