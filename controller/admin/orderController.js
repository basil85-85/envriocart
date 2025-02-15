import Order from "../../models/orderSchema.js";
import moment from "moment";

const getOrders = async (req, res) => {
    try {
        // Uncomment this section when you want to use session authentication
        // if (!req.session.admin) {
        //     return res.redirect("/login");
        // }
        
        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of orders per page
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
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages
        });
    } catch (error) {
        console.log(`Error occurred while rendering the orders page: ${error}`);
        return res.render("404");
    }
};
export default {
    getOrders
}