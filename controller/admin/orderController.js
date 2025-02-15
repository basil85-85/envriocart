import Order from "../../models/orderSchema.js";
import moment from "moment";

const getOrders = async (req, res) => {
    try {
        // Uncomment this section when you want to use session authentication
        // if (!req.session.admin) {
        //     return res.redirect("/login");
        // }
        
        // Pagination setup
        

        const page =Math.max(1, parseInt(req.query.page) || 1)
        const limit = 10; 
        const skip = (page - 1) * limit;
        
        // Get total number of orders for pagination
        const totalOrders = await Order.countDocuments({});
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Get orders with pagination
        const orders = await Order.find({})
            .populate("userId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        return res.render("orders-list", { 
            orders, 
            moment, 
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
          },
        });
    } catch (error) {
        console.log(`Error occurred while rendering the orders page: ${error}`);
        return res.render("404");
    }
};
const ViewOrders =async (req,res) => {
    try {
        let id=req.query.id
        console.log(id)
        const order =await Order.findById(id)
        console.log(order)
        return res.render("order-detail",{order,moment})
    } catch (error) {
        console.log(`error occur on the rendering the view page due to:${error}`)
        return res.render("pages-404")
    }
}
export default {
    getOrders,
    ViewOrders
}