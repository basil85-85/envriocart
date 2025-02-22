
import Coupon from "../../models/couponSchema.js";
import Cart from "../../models/cartSchema.js";
import cron from "node-cron"
 

const applyedCoupon = async (req, res) => {
    try {
        // console.log(req.body);
        const { couponCode} = req.body;
        let userId = req.session.userId;
        const cart = await Cart.findOne({userId:req.session.userId})
        let  cartValue=cart.totalPrice 
        if (!couponCode) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }

        if (req.session.couponID) {
            const oldCoupon = await Coupon.findById(req.session.couponID);
            if (oldCoupon) {
                oldCoupon.usedBy = oldCoupon.usedBy.filter(id => id.toString() !== userId.toString());
                oldCoupon.usageLimit += 1; 
                await oldCoupon.save();
            }
            req.session.discountAmount = 0;
            req.session.couponID = null;
            req.session.couponApplied = false;
        }

        const coupon = await Coupon.findOne({ code: couponCode, status: "active", usageLimit: { $gt: 0 } });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid or expired coupon" });
        }

        if (cartValue < coupon.minCartValue) {
            return res.status(400).json({ success: false, message: `Minimum cart value should be ₹${coupon.minCartValue}` });
        }
        if(coupon.usageLimit<=0){
            return res.status(400).json({ success: false, message: `coupon limited ${coupon.usageLimit}` });
        }

        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ success: false, message: "You have already used this coupon" });
        }

        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = (cartValue * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
        } else if (coupon.discountType === "fixed") {
            discountAmount = coupon.discountValue;
        }

        // coupon.usedBy.push(userId);
        // coupon.usageLimit -= 1;
        await coupon.save();

        req.session.discountAmount = discountAmount;
        req.session.couponID = coupon.id;
        req.session.couponApplied = true;

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discountAmount,
            finalPrice: cartValue - discountAmount,
        });

    } catch (error) {
        console.error(`Error applying coupon: ${error.message}`);
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};


const removeCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon" });
        }
        
        const userId = req.session.userId;
        const cart =await Cart.findOne({userId:req.session.userId})
      
        coupon.usedBy = coupon.usedBy.filter(id => id.toString() !== userId.toString());
        coupon.usageLimit += 1;
        await coupon.save();
        let  cartValue=cart.totalPrice 
        let discountAmount = 0;
  
        delete req.session.discountAmount;
        delete req.session.couponID;
        delete req.session.couponApplied;

        return res.status(200).json({ success: true, message: "Coupon removed successfully" ,discountAmount,
            finalPrice: cartValue - discountAmount,});

    } catch (error) {
        console.error(`Error removing coupon: ${error.message}`);
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};






const updateExpiredCoupon = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        await Coupon.updateMany(
            { endDate: { $lte: today }, status: "active" },
            { $set: { status: "expired" } }
        );


        await Coupon.updateMany(      
            { startDate: { $lte: today }, status: "upcoming" },
            { $set: { status: "active" } }
        );
     
      
    } catch (error) {
        console.error(` Error updating coupon statuses: ${error.message}`);
    }
};


cron.schedule("0 0 * * *", updateExpiredCoupon);
    
updateExpiredCoupon();
export default {
    updateExpiredCoupon,
    applyedCoupon,
    removeCoupon
}