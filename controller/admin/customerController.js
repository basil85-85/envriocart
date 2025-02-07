import User from '../../models/userSchema.js';

const customerInfo = async (req, res) => {
    try {
        // Handle search query
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        // Handle pagination
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page, 10);
        }
        const limit = 3;

       
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } }, 
                { email: { $regex: ".*" + search + ".*", $options: "i" } } 
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        // Count total documents for pagination
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        });

        // Calculate total pages
        const totalPages = Math.ceil(count / limit);

        // Render the view with data
        res.render('customer-list', {
            data: userData,
            currentPage: page,
            totalPages: totalPages,
            search: search,
            count:count,
          
        });
    } catch (error) {
        console.error('Error in customerInfo:', error);
        res.status(500).send('Internal Server Error');
    }
};

const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        return res.status(200).json({ success: true, message: "Customer blocked successfully" });
    } catch (error) {
        console.error(`Error occurred while blocking the customer: ${error}`);
        return res.status(500).json({ success: false, message: "An error occurred" });
    }
};

const customerUnblocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        return res.status(200).json({ success: true, message: "Customer unblocked successfully" });
    } catch (error) {
        console.error(`Error occurred while unblocking the customer: ${error}`);
        return res.status(500).json({ success: false, message: "An error occurred" });
    }
};
    

export default {
    customerInfo,
    customerBlocked,
    customerUnblocked
};
              