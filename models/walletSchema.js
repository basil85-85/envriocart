import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const WalletSchema = new Schema(
      {
            userId: {
                  type: Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
            },
            wallet: {  
                  type: Number,  
                  required: true,
                  default: 0,  
            },
            transactions: [  
                  {
                        transactionType: {  
                              type: String,
                              enum: ['credit', 'debit'],  
                              required: true,
                        },
                        amount: {
                              type: Number,
                              required: true,
                        },
                        description: {
                              type: String,
                              required: true,
                        },
                        createdAt: {
                              type: Date,
                              default: Date.now,  
                        },
                  },
            ],
      },
      { timestamps: true }
);

WalletSchema.methods.calculateTotalAmount = function () {
      this.wallet = this.transactions.reduce((total, transaction) => {
            return transaction.transactionType === 'credit' 
                  ? total + transaction.amount 
                  : total - transaction.amount;  
      }, 0);
      return this.wallet;
};

export default mongoose.model('Wallet', WalletSchema);
