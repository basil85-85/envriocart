import Razorpay from "razorpay";
import crypto from 'crypto';
import Order from "../../models/orderSchema.js";
import Cart from "../../models/cartSchema.js";
import Verient from "../../models/verientSchema.js";
import Coupon from "../../models/couponSchema.js";


const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});

const createOrder = async (req, res) => {
    try {
        console.log(req.body)
        let { payment ,address, cartItems, discount, deliveryCharge } = req.body;
        const userId = req.query.id;

        if ( !address || !cartItems) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        discount=req.session.discountAmount
        const totalAmount = cartItems.reduce((acc, item) => acc + item.total, 0);
        const grandTotal = totalAmount + (deliveryCharge || 0) - (discount || 0);

        const receiptId = `rcpt_${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(-4)}`;

        const options = {
            amount: Math.round(grandTotal * 100),
            currency: "INR",
            receipt: receiptId,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const order = await Order.create({
            userId: userId,
            address: {
                id: address.id,
                name: address.name,
                address: address.address,
                pincode: address.pincode,
                phone: address.phone
            },
            payment: {
                method: "RAZOR PAY",
                id: razorpayOrder.id,
                status: 'Failed'  
            },
            cartItems: cartItems.map(item => ({
                name: item.name,
                color: item.color,
                price: item.price,
                size: item.size,
                quantity: item.quantity,
                total: item.total,
                image: item.image,
                verientId: item.verientId
            })),
            discount: discount || 0,
            deliveryCharge: deliveryCharge || 0,
            totalAmount: totalAmount, 
            couponApplied:req.session.couponApplied ||false ,   
            grandTotal: grandTotal,   
            orderStatus: 'Pending'
        });
        req.session.orderID=order.id
        console.log(req.session.orderID)
        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            message: "Order created successfully"
        });
        delete req.session.discountAmount
    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;
        
        const userId = req.query.id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.key_secret)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;
       
        if (isAuthentic) {
            await Order.findOneAndUpdate(
                { "payment.id": razorpay_order_id },
                {
                    $set: {
                        "payment.status": "Paid",
                        orderStatus: "Processing"
                    }
                }
            );
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

             const order = await Order.findById(req.session.orderID)
             if(!order){
                return res.status(401).json({success:false,message:"order Id is not definded"})
             }
             for (let item of order.cartItems) {

                const variant = await Verient.findOne({ _id: item.verientId });
    
                if (!variant) {
                    return res.status(404).json({ success: false, message: `Variant for ${item.name} not found.` });
                }
    
    
                if (variant.size[item.size] < item.quantity) {
                    return res.status(400).json({ success: false, message: `${item.name} (Size: ${item.size}) is out of stock!` });
                }
    
     
                variant.size[item.size] -= item.quantity;
                await variant.save();
            }
            await Cart.deleteOne({ userId });
            res.json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            await Order.findOneAndUpdate(
                { "payment.id": razorpay_order_id },
                { 
                    $set: { 
                        "payment.status": "Failed",
                        orderStatus: "Cancelled"
                    } 
                }
            );

            res.json({
                success: false,
                message: "Payment verification failed"
            });
        }

    } catch (error) {
        console.error("Error in verifyPayment:", error);
        res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
};

// Changed to named exports
export default{ createOrder, verifyPayment };