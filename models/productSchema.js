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
           categoryName :{
                  type: mongoose.Schema.Types.ObjectId,       
                  ref:'Category',
                  required:true
            },
            variants: [
                  { type: mongoose.Schema.Types.ObjectId, ref: 'Verient' },
            ],
            dateAdded: { type: Date, default: Date.now },
      },
      { timestamps: true }
)

productSchema.virtual('variantCount').get(function() {
    return this.variants.length;
  });

const Product = mongoose.model('Product', productSchema)

export default Product
