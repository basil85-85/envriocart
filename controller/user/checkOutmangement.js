import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js"
import Order from "../../models/orderSchema.js";

const getCheckout = async (req,res) => {
    try {
        let isLoggedIn =true
        const countCart = res.locals.cartCount
        
        const userID=req.session.userId
        const cart = await Cart.findOne({userId:userID})
        const details =await Address.find({userId:userID})
        if(cart){
        return res.render("checkout",{isLoggedIn,countCart,cart,details})
        }
        else{
            return res.redirect("/cart")
        }

    } catch (error) {
        console.log(`error occur on the check out page due to :${error}`)
        return res.render("404")
    }
}

//post method for oder the page of the in there check out page 
const placeOrder = async (req, res) => {
    try {
        console.log("Order Request Received:", req.body);
        let userId=req.query.id
        const { address, payment, cartItems, discount, deliveryCharge } = req.body;
        if (!userId || !address || !payment || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        let totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
        let grandTotal = totalAmount + (deliveryCharge || 0) - (discount || 0);
        
        const newOrder = new Order({
            userId,
            address,
            payment,
            cartItems,
            discount: discount || 0,
            deliveryCharge: deliveryCharge || 0,
            totalAmount,
            grandTotal,
        });


        await newOrder.save();
        await Cart.deleteOne({ userId });
        res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//render the order sucess page for oder render this page 
// const getOrderSuccess = async (req, res) => {
//     try {
//         if (!req.session || !req.session.userId) {
//             return res.redirect("/login"); 
//         }

//         const countCart = res.locals.cartCount || 0;
//         const userID = req.session.userId;
//         const orders = await Order.findOne({ userId: userID }).sort({ createdAt: -1 });
//       console.log(orders)
//         if (orders) {
//             return res.render("order-success", {
//                 isLoggedIn: true,
//                 countCart,
//                 orders
//             });
//         } else {
//             return res.redirect("/"); 
//         }

//     } catch (error) {
//         console.error(`Error fetching order success page: ${error.message}`);
//         return res.render("404");
//     }
// };
const getOrderSuccess = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect("/login"); 
        }
        if (req.session.orderSuccessViewed) {
            return res.redirect("/"); 
        }
        const countCart = res.locals.cartCount || 0;
        const userID = req.session.userId;

        const orders = await Order.find({ userId: userID });

        if (orders.length > 0) {
            req.session.orderSuccessViewed = true;
            return res.render("order-success", {
                isLoggedIn: true,
                countCart,
                orders
            });
        } else {
            return res.redirect("/"); 
        }
    } catch (error) {
        console.error(`Error fetching order success page: ${error.message}`);
        return res.render("404");
    }
};



export default {
   getCheckout,
   placeOrder,
   getOrderSuccess
}