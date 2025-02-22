import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import AutoIncrement from 'mongoose-sequence'

const { Schema } = mongoose

const orderSchema = new Schema(
      {
            orderId: {
                  type: Number,
                  unique: true,
            },
            userId: {
                  type: Schema.Types.ObjectId,
                  ref: 'User',
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
                        enum: [
                              'CASH ON DELIVERY',
                              "RAZOR PAY",
                              "Wallet"
                        ],
                        required: true,
                  },
                  id: { type: String, required: true },
                  status: {
                        type: String,
                        enum: ['unpaid', 'Paid', 'Failed'],
                        default: 'unpaid',
                  },
            },
            cartItems: [
                  {
                        name: { type: String, required: true },
                        color: { type: String, required: true },
                        price: { type: Number, required: true },
                        size: { type: String, required: true },
                        quantity: { type: Number, required: true, min: 1 },
                        total: { type: Number, required: true },
                        image: { type: String, required: true },
                        verientId: {
                              type: Schema.Types.ObjectId,
                              ref: 'Verient',
                              required: true,
                        },
                  },
            ],
            discount: { type: Number, default: 0 },
            deliveryCharge: { type: Number, default: 0 },
            totalAmount: { type: Number, required: true },
            grandTotal: { type: Number, required: true },
            couponApplied:{ type: Boolean, default: false },
            returnReason:{type:String,required:false},
            cancelReason:{type:String,required:false},
            orderStatus: {
                  type: String,
                  enum: [
                        'Pending',
                        'Processing',
                        'Shipped',
                        'Delivered',
                        'requesed',
                        'approved',
                        'rejected',
                        'Cancelled',
                  ],
                  default: 'Pending',
            },
            invoiceDate: { type: Date, default: Date.now },
      },
      { timestamps: true }
)

orderSchema.pre('save', function(next) {
      this.totalAmount = this.cartItems.reduce(
            (acc, item) => acc + item.total,
            0
      )
      this.grandTotal = this.totalAmount + this.deliveryCharge - this.discount
      next()
})

orderSchema.plugin(AutoIncrement(mongoose), { inc_field: 'orderId' })
const Order = mongoose.model('Order', orderSchema)

export default Order
