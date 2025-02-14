import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ["CASH ON DELIVERY", "Credit Card", "Debit Card", "Net Banking", "UPI"],
        required: true,
      },
      id: { type: String, required: true },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
      },
    },
    cartItems: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true },
        image: { type: String, required: true },
      },
    ],
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Total cart value before discount & delivery
    grandTotal: { type: Number, required: true }, // Final amount after discount & delivery
    couponApplied: { type: Boolean, default: false },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    invoiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// **Auto-calculate totals before saving**
orderSchema.pre("save", function (next) {
  this.totalAmount = this.cartItems.reduce((acc, item) => acc + item.total, 0);
  this.grandTotal = this.totalAmount + this.deliveryCharge - this.discount;
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
