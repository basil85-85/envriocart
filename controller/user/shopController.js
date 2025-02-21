import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'




//shoping pages
const shoppage = async (req, res) => {
      try {
            const userId = req.session.userId
            let page = parseInt(req.query.page) || 1
            let limit = parseInt(req.query.limit) || 20
            const countCart =res.locals.cartCount
            let skip = (page - 1) * limit
            const products = await Product.find({
                  isBlocked: false,
                  variants: { $exists: true, $ne: [] },
            })
                  .populate('variants')
                  .populate("categoryName")
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
                  totalPages: Math.ceil(totalProducts / limit),
                  countCart
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
        let products = await Product.findById(id).populate("variants").populate("categoryName")
        const countCart =res.locals.cartCount
        
        let relatedProducts = await Product.find({
            categoryName: products.categoryName, 
            _id: { $ne: id } 
        }).populate("variants")
        .limit(4)
        
        
        let isLoggedIn = false;
        if (userId) {
            const userData = await User.findOne({ _id: userId, isBlocked: false });

            if (userData) {
                isLoggedIn = true;
            }
        }

        return res.render('details', { isLoggedIn, products,relatedProducts,countCart});

    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).render("404");
    }
};

const filterCategory = async (req, res) => {
      try {
        const categoryName = req.query.name; // Get category name from query
        const sortOption = req.query.sort;
        
        console.log(`Filtering by category name: ${categoryName}, Sort: ${sortOption}`);

        const category = await mongoose.model('Category').findOne({
          name: { $regex: categoryName, $options: 'i' } 
        });
        
        if (!category) {
          return res.json({ 
            success: true, 
            products: [], 
            message: "Category not found" 
          });
        }
        

        let productsQuery = Product.find({
          categoryName: category._id,
          isBlocked: false
        });
        
 
        switch(sortOption) {
          case 'ascending':
            productsQuery = productsQuery.sort({ productName: 1 });
            break;
          case 'descending':
            productsQuery = productsQuery.sort({ productName: -1 });
            break;
          case 'lowToHigh':
            productsQuery = productsQuery.sort({ salePrice: 1 });
            break;
          case 'highToLow':
            productsQuery = productsQuery.sort({ salePrice: -1 });
            break;
          case 'offerprice':
            productsQuery = productsQuery.sort({ productOffer: -1 });
            break;
          case 'newArrival':
            productsQuery = productsQuery.sort({ dateAdded: -1 });
            break;
          default:
            productsQuery = productsQuery.sort({ dateAdded: -1 });
        }
        
        const products = await productsQuery.populate('variants');
        
        return res.json({ 
          success: true, 
          products,
          count: products.length,
          categoryId: category._id
        });
        
      } catch (error) {
        console.log(`Error filtering by category name: ${error}`);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };


export default {
      shoppage,
      details,
      filterCategory
}
