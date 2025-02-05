import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const productSchema = new Schema(
      {
            productName: {
                  type: String,
                  required: true,
            },
            description: {
                  type: String,
                  required: true,
            },
            regularPrice: {
                  type: Number,
                  required: true,
            },
            salePrice: {
                  type: Number,
                  required: true,
            },
            categoryName: {
                  type: String,
                  required: true,
            },
            productOffer: {
                  type: Number,
                  default: 0,
            },
            isBlocked: {
                  type: Boolean,
                  default: false,
            },
            status: {
                  type: String,
                  enum: ['Avaiable', 'out of stock', 'discountinued'],
                  required: true,
                  default: 'Avaiable',
            },
           
            variants: [
                  { type: mongoose.Schema.Types.ObjectId, ref: 'Verient' },
            ],
      },
      { timestamps: true }
)

productSchema.virtual('variantCount').get(function() {
    return this.variants.length;
  });

const Product = mongoose.model('Product', productSchema)

export default Product
