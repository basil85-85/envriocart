import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const verientSchema = new Schema(
      {
            productId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Product',
                  required: true,
            },
            productcolor: {
                  type: String,
                  required: true,
            },
            size: {
                  S: {
                        type: Number,
                        required: true,
                        default: 0,
                  },
                  M: {
                        type: Number,
                        required: true,
                        default: 0, 
                  },
                  L: {
                        type: Number,
                        required: true,
                        default: 0,
                  },

                  XL: {
                        type: Number,
                        required: true,
                        default: 0,
                  },
                  XXL: {
                        type: Number,
                        required: true,
                        default: 0,
                  },
            },

            productImg: {
                  type: [String],
                  required: true,
            },
      },
      { timestamps: true }
)

const Verient = mongoose.model('Verient', verientSchema)

export default Verient
