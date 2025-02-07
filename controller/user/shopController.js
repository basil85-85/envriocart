import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'



//shoping pages
const shoppage = async (req, res) => {
      try {
            const userId = req.session.userId
            let page = parseInt(req.query.page) || 1
            let limit = parseInt(req.query.limit) || 10

            let skip = (page - 1) * limit
            const products = await Product.find({
                  isBlocked: false,
                  variants: { $exists: true, $ne: [] },
            })
                  .populate('variants')
                  .skip(skip)
                  .limit(limit)
            const totalProducts = await Product.countDocuments({
                  isBlocked: false,
                  variants: { $exists: true, $ne: [] },
            })
            const category = await Category.find({  isListed: true })
            let isLoggedIn = false
            if (userId) {
                  const userData = await User.findOne({
                        _id: userId,
                        isBlocked: false,
                  })
                  isLoggedIn = !!userData
            }

            return res.render('shop', {
                  isLoggedIn,
                  products,
                  category,
                  currentPage: page,
                  totalPages: Math.ceil(totalProducts / limit), // Calculate total pages
            })
      } catch (error) {
            console.error('Error rendering shop page:', error)
            res.status(500).render('404')
      }
}

//product deatils
const details = async (req, res) => {
    try {
        
        let userId 
        if(req.session.passport){
          req.session.userId=req.session.passport.user;
        } 
        userId=req.session.userId;
        const id =req.query.id
        let products = await Product.findById( id).populate("variants")

        let isLoggedIn = false;
        if (userId) {
            const userData = await User.findOne({ _id: userId, isBlocked: false });

            if (userData) {
                isLoggedIn = true;
            }
        }

        return res.render('details', { isLoggedIn, products });

    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).render("404");
    }
};



export default {
      shoppage,
      details
}
