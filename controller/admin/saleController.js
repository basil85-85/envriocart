import Order from "../../models/orderSchema.js";
import moment from 'moment';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

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
        console.log( result.orders)
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




const downloadReport = async (req, res) => {
    try {
        // console.log(req.params.id)
        const { format, filter, startDate, endDate } = req.query;
        console.log(req.query.id)
        let matchCondition = {
            orderStatus: { $nin: ['Cancelled', 'rejected'] }
        };

        if (filter === 'custom' && startDate && endDate) {
            matchCondition.invoiceDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (filter === 'daily') {
            matchCondition.invoiceDate = {
                $gte: moment().startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filter === 'weekly') {
            matchCondition.invoiceDate = {
                $gte: moment().startOf('week').toDate(),
                $lte: moment().endOf('week').toDate()
            };
        } else if (filter === 'yearly') {
            matchCondition.invoiceDate = {
                $gte: moment().startOf('year').toDate(),
                $lte: moment().endOf('year').toDate()
            };
        }

        const orders = await Order.find(matchCondition)
            .populate('userId', 'name email')
            .sort({ invoiceDate: -1 });

        if (format === 'pdf') {
            await generatePDF(res, orders);
        } else if (format === 'excel') {
            await generateExcel(res, orders);
        } else {
            res.status(400).json({ message: 'Invalid format specified' });
        }

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};
const generatePDF = async (res, orders) => {
    const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Helper function to add page numbers
    const addPageNumbers = () => {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .text(
                    `Page ${i + 1} of ${pages.count}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
        }
    };

    // Add header with border
    doc.rect(50, 30, 500, 80)
       .stroke();
    
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Sales Report', { align: 'center' })
       .fontSize(12)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .text(`Time: ${new Date().toLocaleTimeString()}`, { align: 'center' });

    doc.moveDown(3);

    // Add summary statistics with more metrics
    const totalSales = orders.reduce((sum, order) => sum + order.grandTotal, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalSales / totalOrders;
    const completedOrders = orders.filter(order => order.orderStatus.toLowerCase() === 'completed').length;
    const pendingOrders = orders.filter(order => order.orderStatus.toLowerCase() === 'pending').length;
    const cancelledOrders = orders.filter(order => order.orderStatus.toLowerCase() === 'cancelled').length;

    // Add summary box with border
    doc.rect(50, doc.y, 500, 180)
       .stroke();

    doc.font('Helvetica-Bold')
       .fontSize(16)
       .text('Summary', { align: 'center' });

    doc.moveDown(0.5);

    const summaryTable = {
        headers: ['Metric', 'Value'],
        rows: [
            ['Total Orders', totalOrders],
            ['Total Sales', `${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
            ['Average Order Value', `${averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
            ['Completed Orders', `${completedOrders} (${((completedOrders/totalOrders) * 100).toFixed(1)}%)`],
            ['Pending Orders', `${pendingOrders} (${((pendingOrders/totalOrders) * 100).toFixed(1)}%)`],
            ['Cancelled Orders', `${cancelledOrders} (${((cancelledOrders/totalOrders) * 100).toFixed(1)}%)`]
        ]
    };

    let currentY = doc.y;
    const summaryColumnWidth = 200;

    doc.rect(60, currentY - 5, 480, 20)
       .fill('#e6e6e6');
    
    summaryTable.headers.forEach((header, i) => {
        doc.fillColor('black')
           .font('Helvetica-Bold')
           .text(header, 70 + (i * summaryColumnWidth), currentY, { width: summaryColumnWidth });
    });

    currentY += 20;

    summaryTable.rows.forEach((row, index) => {
        if (index % 2 === 0) {
            doc.rect(60, currentY - 5, 480, 20)
               .fill('#f5f5f5');
        }

        doc.fillColor('black')
           .font('Helvetica');
        row.forEach((cell, i) => {
            doc.text(cell.toString(), 70 + (i * summaryColumnWidth), currentY, { width: summaryColumnWidth });
        });
        currentY += 20;
    });

    doc.moveDown(3);
    doc.rect(50, doc.y, 500, doc.page.height - doc.y - 60)
       .stroke();

    doc.font('Helvetica-Bold')
       .fontSize(16)
       .text('Order Details', { align: 'center' });

    doc.moveDown(0.5);

   
    const tableHeaders = ['Order ID', 'Date', 'Customer', 'Status', 'Amount'];
    const columnWidths = [45, 100, 150, 100, 80];
    let startX = 60;  
    let y = doc.y;
    doc.rect(50, y - 5, 500, 25)
       .fill('#e6e6e6');

    doc.fillColor('black')
       .font('Helvetica-Bold')
       .fontSize(11);

    tableHeaders.forEach((header, i) => {
        doc.text(header, startX, y, { 
            width: columnWidths[i], 
            align: i === tableHeaders.length - 1 ? 'right' : 'left' 
        });
        startX += columnWidths[i];
    });
    doc.moveTo(50, y + 20)
       .lineTo(550, y + 20)
       .stroke();
    doc.moveTo(50, y + 22)
       .lineTo(550, y + 22)
       .stroke();

    doc.moveDown();

    doc.font('Helvetica')
       .fontSize(10);

    orders.forEach((order, index) => {
        y = doc.y;

        if (y > 700) {
            doc.addPage();
 
            doc.rect(50, 30, 500, doc.page.height - 90)
               .stroke();
            
            y = 50;

            doc.rect(50, y - 5, 500, 25)
               .fill('#e6e6e6');

            startX = 60;
            doc.fillColor('black')
               .font('Helvetica-Bold');
               
            tableHeaders.forEach((header, i) => {
                doc.text(header, startX, y, { 
                    width: columnWidths[i], 
                    align: i === tableHeaders.length - 1 ? 'right' : 'left' 
                });
                startX += columnWidths[i];
            });

            doc.moveTo(50, y + 20)
               .lineTo(550, y + 20)
               .stroke();
            doc.moveTo(50, y + 22)
               .lineTo(550, y + 22)
               .stroke();

            doc.moveDown();
            doc.font('Helvetica');
            y = doc.y;
        }

        if (index % 2 === 0) {
            doc.rect(51, y - 5, 498, 20)
               .fill('#f8f8f8');
        }

        startX = 60;

        doc.fillColor('black')
           .text(order.orderId.toString(), startX, y, { 
                width: columnWidths[0], 
                align: 'left' 
            });
        startX += columnWidths[0];

        const orderDate = new Date(order.invoiceDate);
        doc.text(
            `${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 
            startX, 
            y, 
            { 
                width: columnWidths[1], 
                align: 'left' 
            }
        );
        startX += columnWidths[1];

        doc.text(order.userId?.name || 'N/A', startX, y, { 
            width: columnWidths[2], 
            align: 'left' 
        });
        startX += columnWidths[2];

        const statusColor = {
            'Delivered': '#4CAF50', 
            'pending': '#FF9800',    
            'Cancelled': '#DC3545'   
        }[order.orderStatus.toLowerCase()] || '#6c757d';  

        doc.rect(startX - 2, y - 2, 80, 16)
           .fill(statusColor + '20'); 
        doc.fillColor(statusColor)
           .text(order.orderStatus, startX, y, { 
                width: columnWidths[3], 
                align: 'left' 
            });
        startX += columnWidths[3];
        doc.fillColor('black')
           .font('Helvetica-Bold')
           .text(
                `${order.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
                startX, 
                y, 
                { 
                    width: columnWidths[4], 
                    align: 'right' 
                }
            );
        
        doc.font('Helvetica');
        doc.moveDown(0.5);
    });
    doc.rect(50, doc.page.height - 40, 500, 25)
       .stroke();
    doc.fontSize(8)
       .text(
            `Report generated by System on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 35,
            { align: 'center' }
        );
    addPageNumbers();
    doc.end();
};
const generateExcel = async (res, orders) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 10 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Customer Name', key: 'customerName', width: 40 },
        { header: 'Customer Email', key: 'customerEmail', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Items', key: 'items', width: 10 },
        { header: 'Total Amount', key: 'amount', width: 12 },
        { header: 'Payment Method', key: 'paymentMethod', width: 30 }
    ];
    orders.forEach(order => {
        worksheet.addRow({
            orderId: order.orderId,
            date: moment(order.invoiceDate).format('DD/MM/YYYY'),
            customerName: order.userId?.name || 'N/A',
            customerEmail: order.userId?.email || 'N/A',
            status: order.orderStatus,
            items: order.cartItems.length,
            amount: order.grandTotal.toFixed(2),
            paymentMethod: order.payment.method
        });
    });
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=sales_report_${Date.now()}.xlsx`
    );
    await workbook.xlsx.write(res);
};


export default {
    getSalereport,
    getSaleReportFiltering,
    downloadReport
};
