import mongoose from 'mongoose'
const { Schema } = mongoose

const couponSchema = new Schema(
      {
            code: {
                  type: String,
                  required: true,
                  unique: true,
                  trim: true,
            },
            status: {
                  type: String,
                  enum: ['active', 'inactive'],  // Matches your object format
                  default: 'active',
            },
            startDate: {
                  type: Date,
                  required: true,
            },
            endDate: {
                  type: Date,
                  required: true,
            },
            minCartValue: {
                  type: Number,  // Matches `minCartValue` in object
                  default: 0,
            },
            couponLimits: {
                  type: Number,  // Matches `couponLimits` in object
                  required: true,
            },
            discountType: {
                  type: String,
                  enum: ['percentage', 'fixed'],  // Matches your object format
                  required: true,
            },
            discountValue: {
                  type: Number,  // Matches `discountValue` in object
                  required: true,
            },
            maxDiscount: {
                  type: Number, 
            },
            usageLimit: {
                  type: Number,
                  default: 1,
            },
            usedCount: {
                  type: Number,
                  default: 0,
            },
            isListed: {
                  type: Boolean,
                  default: true,
            },
            userId: [
                  {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                  },
            ],
      },
      { timestamps: true }
)

const Coupon = mongoose.model('Coupon', couponSchema)

export default Coupon
