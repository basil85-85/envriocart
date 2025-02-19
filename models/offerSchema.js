import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const OfferSchema = new Schema(
      {
            status: {
                  type: String,
                  enum: ['active', 'inactive', 'expire'],
                  required: true,
                  default: 'active',
            },
            startDate: {
                  type: Date,
                  required: true,
            },
            image: {
                  type: String,
                  required: false,
              },
            endDate: {
                  type: Date,
                  required: true,
            },
            offerName: {
                  type: String,
                  required: true,
            },
            description: {
                  type: String,
                  required: true,
            },
            offerType: {
                  type: String,
                  enum: ['product', 'category'],
                  required: true,
            },
            // Modified to support multiple products
            productIds: [
                  {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                  },
            ],
            categoryId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'Category',
                  default: null,
            },
            discountType: {
                  type: String,
                  enum: ['fixed', 'percentage'],
                  required: true,
            },
            discountValue: {
                  type: Number,
                  required: true,
            },
      },
      { timestamps: true }
)

const Offer = mongoose.model('Offer', OfferSchema)

export default Offer
