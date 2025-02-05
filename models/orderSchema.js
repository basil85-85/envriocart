import mongoose from "mongoose";

const { Schema } = mongoose;

//unique IDs generate cheyyan
import { v4 as uuidv4 } from "uuid";

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      default: () => uuidv4()
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true
    },
    orderItems: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", // Reference to the Product model
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          default:0
        },
        total: {
          type: Number,
          required: true // quantity * price
        }
      }
    ],
    shippingAddress:{
        type:Schema.Types.ObjectId,
        ref:"user",
        require:true,
    },
    discount:{
        type:Number,
        default:0
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:["pending","processing","shipped","Deliviered","cancelled","return request"]
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "Debit Card", "Net Banking", "UPI"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending"
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    totalAmount: {
      type: Number,
      required: true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    deliveryCharge: {
      type: Number,
      default: 0 // Add delivery charges if applicable
    },
    grandTotal: {
      type: Number,
      required: true // totalAmount + deliveryCharge
    }
  },
  {
    timestamps: true // Automatically manages `createdAt` and `updatedAt` fields
  }
);

// Middleware to calculate `total` for items and `grandTotal`
orderSchema.pre("save", function(next) {
  this.items.forEach(item => {
    item.total = item.quantity * item.price; // Calculate total for each item
  });
  this.totalAmount = this.items.reduce((acc, item) => acc + item.total, 0); // Sum all item totals
  this.grandTotal = this.totalAmount + this.deliveryCharge; // Include delivery charges
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
