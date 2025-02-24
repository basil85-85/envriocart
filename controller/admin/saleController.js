import Order from "../../models/orderSchema.js";
import moment from 'moment';

const getSalereport = async (req, res) => {
    try {
        let { filter, startDate, endDate, page = 1 } = req.query;
        const limit = 8;
        const skip = (page - 1) * limit;
        
        let matchCondition = { orderStatus: { $nin: ['Cancelled', 'rejected'] } };
        
        if (filter === "daily") {
            matchCondition.invoiceDate = {
                $gte: moment().startOf("day").toDate(),
                $lte: moment().endOf("day").toDate()
            };
        } else if (filter === "weekly") {
            matchCondition.invoiceDate = {
                $gte: moment().startOf("week").toDate(),
                $lte: moment().endOf("week").toDate()
            };
        } else if (filter === "yearly") {
            matchCondition.invoiceDate = {
                $gte: moment().startOf("year").toDate(),
                $lte: moment().endOf("year").toDate()
            };
        } else if (filter === "custom" && startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const report = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$grandTotal" },
                    totalDiscounts: { $sum: "$discount" }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments(matchCondition);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find(matchCondition)
            .populate("userId", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ invoiceDate: -1 });
        //  console.log(orders)
        return res.render("sale-report", { 
            report: report[0] || {}, 
            orders, 
            filter,
            currentPage: parseInt(page),
            totalPages,
            totalOrders,
            limit,
            startDate: startDate || '', // Pass startDate to template
            endDate: endDate || ''      // Pass endDate to template
        });
    } catch (error) {
        console.log(`Error rendering the sale report: ${error}`);
        return res.render("pages-404");
    }
};


async function getSaleReportFiltering(req, res) {
    try {
        const { filter, startDate, endDate, page = 1 } = req.body;
        const limit = 8;
        const skip = (page - 1) * limit;

        // Build date filter
        let dateFilter = {};
        switch (filter) {
            case 'daily':
                dateFilter = {
                    $gte: moment().startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                };
                break;
            case 'weekly':
                dateFilter = {
                    $gte: moment().startOf('week').toDate(),
                    $lte: moment().endOf('week').toDate()
                };
                break;
            case 'yearly':
                dateFilter = {
                    $gte: moment().startOf('year').toDate(),
                    $lte: moment().endOf('year').toDate()
                };
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide start and end dates"
                    });
                }
                dateFilter = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
                break;
        }

        // Get orders
        const [result] = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $nin: ['Cancelled', 'rejected'] },
                    invoiceDate: dateFilter
                }
            },
            {
                $facet: {
                    report: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: "$grandTotal" },
                                totalDiscounts: { $sum: "$discount" }
                            }
                        }
                    ],
                    orders: [
                        { $sort: { invoiceDate: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "users",
                                localField: "userId",
                                foreignField: "_id",
                                as: "user"
                            }
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        { $project: { "user.password": 0 } }
                    ],
                    totalCount: [{ $count: "count" }]
                }
            }
        ]);

        // Check if data exists
        if (!result || !result.report) {
            return res.status(404).json({
                success: false,
                message: "No data found for the selected period"
            });
        }

        // Prepare response data
        const reportData = result.report[0] || { totalOrders: 0, totalRevenue: 0, totalDiscounts: 0 };
        const totalOrders = result.totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalOrders / limit);

        // Set content type explicitly
        res.setHeader('Content-Type', 'text/html');
        console.log(reportData)
        // Render response
        return res.render("sale-report", {
            report: reportData,
            orders: result.orders,
            filter,
            currentPage: page,
            totalPages,
            totalOrders,
            limit,
            startDate: startDate || '',
            endDate: endDate || ''
        });

    } catch (error) {
        console.error("Sales report error:", error);
        // Send JSON error response
        return res.status(500).json({
            success: false,
            message: "Failed to generate report"
        });
    }
}
export default {
    getSalereport,
    getSaleReportFiltering
};
