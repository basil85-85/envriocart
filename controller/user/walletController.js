import Verient from "../../models/verientSchema.js";
import Wallet from "../../models/walletSchema.js";
import Order from "../../models/orderSchema.js";
import Cart from "../../models/cartSchema.js";
import Coupon from "../../models/couponSchema.js";

const createOrderWallet = async (req, res) => {
    try {
       
        const userId  = req.query.id
        let { address, payment, cartItems, discount , deliveryCharge  } = req.body;

        // Input validation
        if (!userId || !address || !payment || !cartItems?.length) {
            return res.status(401).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        if (req.session.couponID) {
            const coupon = await Coupon.findById(req.session.couponID);

            if (!coupon || coupon.status !== "active") {
                  return res.status(401).json({
                        success: false,
                        message: "Invalid coupon, try another coupon",
                  });
            }

            coupon.usedBy.push(userId);
            coupon.usageLimit -= 1;
            await coupon.save();
      }

        discount=req.session.discountAmount||0

        const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
        
        let grandTotal =totalAmount + (deliveryCharge || 0) - (discount || 0)
        console.log(grandTotal)
        if (payment.method === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            
            if (!wallet || wallet.wallet < grandTotal) {
                return res.status(401).json({
                    success: false,
                    message: 'Insufficient wallet balance'
                });
            }
           console.log(grandTotal)
            const updatedWallet = await Wallet.findOneAndUpdate(
                { userId: userId },
                {
                    $inc: { wallet: -grandTotal  },
                    $push: {
                        transactions: {
                            transactionType: 'debit',
                            amount: grandTotal ,
                            description: `Purchase for Order`,
                        },
                    },
                },
                { new: true, upsert: true } 
            );
                  
            
            if (!updatedWallet) {
                return res.status(401).json({
                    success: false,
                    message: 'Failed to update wallet'
                });
            }
        }
        else{
            return res.status(401).json({ success: false,
                message: 'Wallet is not founeding try Another payment'})
        }

        for (const item of cartItems) {
            const variant = await Verient.findOne({ _id: item.verientId });

            if (!variant) {
                return res.status(401).json({
                    success: false,
                    message: `Variant for ${item.name} not found`
                });
            }

            if (variant.size[item.size] < item.quantity) {
                return res.status(401).json({
                    success: false,
                    message: `${item.name} (Size: ${item.size}) is out of stock`
                });
            }

            variant.size[item.size] -= item.quantity;
            await variant.save();
        }
        payment.status = 'Paid';
        // Create and save order
        const order = await Order.create({
            userId,
            address,
            payment,
            couponApplied:req.session.couponApplied ||false ,
            cartItems,
            discount,
            deliveryCharge,
            totalAmount,
            grandTotal
        });

        // Clear cart
        await Cart.deleteOne({ userId });
        delete req.session.discountAmount
        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export default {
    createOrderWallet
}