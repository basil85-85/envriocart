import Verient from "../../models/verientSchema.js";
import Wallet from "../../models/walletSchema.js";
import Order from "../../models/orderSchema.js";
import Cart from "../../models/cartSchema.js";

const createOrderWallet = async (req, res) => {
    try {
       
        const userId  = req.query.id
        const { address, payment, cartItems, discount , deliveryCharge  } = req.body;

        // Input validation
        if (!userId || !address || !payment || !cartItems?.length) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
        console.log(totalAmount)
        let grandTotal =totalAmount + (deliveryCharge || 0) - (discount || 0)

        if (payment.method === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            
            if (!wallet || wallet.wallet < grandTotal) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance'
                });
            }
           console.log(grandTotal)
            const updatedWallet = await Wallet.findOneAndUpdate(
                { userId: userId },
                {
                    $inc: { wallet: -totalAmount  },
                    $push: {
                        transactions: {
                            transactionType: 'debit',
                            amount: totalAmount ,
                            description: `Purchase for Order`,
                        },
                    },
                },
                { new: true, upsert: true } 
            );
                  
            
            if (!updatedWallet) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update wallet'
                });
            }
        }
        else{
            return res.status(400).json({ success: false,
                message: 'Wallet is not founeding try Anther payment'})
        }

        for (const item of cartItems) {
            const variant = await Verient.findOne({ _id: item.verientId });

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: `Variant for ${item.name} not found`
                });
            }

            if (variant.size[item.size] < item.quantity) {
                return res.status(400).json({
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
           
            cartItems,
            discount,
            deliveryCharge,
            totalAmount,
            grandTotal
        });

        // Clear cart
        await Cart.deleteOne({ userId });

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