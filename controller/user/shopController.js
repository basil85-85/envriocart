import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'
import Offer from '../../models/offerSchema.js'


const checkProductOffer = async (productId) => {
      try {
            const offer = await Offer.findOne({
                  offerType: 'product',
                  productIds: productId,
                  status: 'active', 
                  startDate: { $lte: new Date() }, 
                  endDate: { $gte: new Date() }, 
            })
            return offer ? offer : null 
      } catch (error) {
            console.error('Error checking product offer:', error)
            return null
      }
}
const checkCategoryOffer = async (categoryId) => {
      try {
            const offer = await Offer.findOne({
                  offerType: 'category', 
                  categoryId: categoryId, 
                  status: 'active', 
                  startDate: { $lte: new Date() }, 
                  endDate: { $gte: new Date() },
            })
            return offer ? offer : null 
      } catch (error) {
            console.error('Error checking category offer:', error)
            return null
      }
}

//shoping pages
const shoppage = async (req, res) => {
      try {
            const userId = req.session.userId
            let page = parseInt(req.query.page) || 1
            let limit = parseInt(req.query.limit) || 20
            const countCart = res.locals.cartCount
            let skip = (page - 1) * limit

            // Fetch products
            const products = await Product.find({
                  isBlocked: false,
                  variants: { $exists: true, $ne: [] },
            })
                  .populate('variants')
                  .populate("categoryName")
                  .skip(skip)
                  .limit(limit)

            // Check product-level and category-level offer
            const productsWithOffers = await Promise.all(
                  products.map(async (product) => {
                        const productOffer = await checkProductOffer(product._id)
                        const categoryOffer = await checkCategoryOffer(product.categoryName._id)

                        return {
                              ...product.toObject(),
                              productOffer,
                              categoryOffer,
                        }
                  })
            )

            const totalProducts = await Product.countDocuments({
                  isBlocked: false,
                  variants: { $exists: true, $ne: [] },
            })

            const category = await Category.find({ isListed: true })

            let isLoggedIn = false
            if (userId) {
                  const userData = await User.findOne({ _id: userId, isBlocked: false })
                  isLoggedIn = !!userData
            }
            console.log( productsWithOffers)
            return res.render('shop', {
                  isLoggedIn,
                  products: productsWithOffers, // Send products with both offer details
                  category,
                  currentPage: page,
                  totalPages: Math.ceil(totalProducts / limit),
                  countCart,
            })
      } catch (error) {
            console.error('Error rendering shop page:', error)
            res.status(500).render('404')
      }
}

//product deatils
const details = async (req, res) => {
      try {
          // Get user ID from session
          let userId;
          if (req.session.passport) {
              req.session.userId = req.session.passport.user;
          }
          userId = req.session.userId;
          
          const id = req.query.id;
          
          // Fetch main product with populated data
          let product = await Product.findById(id)
              .populate("variants")
              .populate("categoryName")
              .lean(); // Using lean() for better performance
              
          // Fetch active offers that might apply to this product
          const activeOffers = await Offer.find({
              status: "active",
              endDate: { $gte: new Date() },
              startDate: { $lte: new Date() },
              $or: [
                  { productIds: id }, 
                  { 
                      offerType: 'category',
                      categoryId: product.categoryName._id 
                  }
              ]
          }).sort({ discountValue: -1 }); 
  
          let finalPrice = product.salePrice || product.regularPrice;
          const applicableOffer = activeOffers.find(offer => 
              offer.productIds.some(pid => pid.toString() === id) ||
              (offer.offerType === 'category' && offer.categoryId.toString() === product.categoryName._id.toString())
          );
  
          if (applicableOffer) {
              if (applicableOffer.discountType === "fixed") {
                  finalPrice = Math.max(0, finalPrice - applicableOffer.discountValue);
              } else if (applicableOffer.discountType === "percentage") {
                  finalPrice = Math.max(0, finalPrice - (finalPrice * applicableOffer.discountValue / 100));
              }
          }
  
          product = {
              ...product,
              offerPrice: parseFloat(finalPrice.toFixed(2)),
              originalPrice: product.salePrice || product.regularPrice,
              hasOffer: !!applicableOffer,
              offerDetails: applicableOffer ? {
                  type: applicableOffer.discountType,
                  value: applicableOffer.discountValue,
                  name: applicableOffer.offerName,
                  description: applicableOffer.description,
                  endDate: applicableOffer.endDate
              } : null
          };
  
          let relatedProducts = await Product.find({
              categoryName: product.categoryName._id,
              _id: { $ne: id }
          })
          .populate("variants")
          .limit(4)
          .lean();
  
          relatedProducts = await Promise.all(relatedProducts.map(async (relatedProduct) => {
              let relatedFinalPrice = relatedProduct.salePrice || relatedProduct.regularPrice;
            
              const relatedOffer = activeOffers.find(offer => 
                  offer.productIds.some(pid => pid.toString() === relatedProduct._id.toString()) ||
                  (offer.offerType === 'category' && offer.categoryId.toString() === relatedProduct.categoryName.toString())
              );
  
              if (relatedOffer) {
                  if (relatedOffer.discountType === "fixed") {
                      relatedFinalPrice = Math.max(0, relatedFinalPrice - relatedOffer.discountValue);
                  } else if (relatedOffer.discountType === "percentage") {
                      relatedFinalPrice = Math.max(0, relatedFinalPrice - (relatedFinalPrice * relatedOffer.discountValue / 100));
                  }
              }
  
              return {
                  ...relatedProduct,
                  offerPrice: parseFloat(relatedFinalPrice.toFixed(2)),
                  originalPrice: relatedProduct.salePrice || relatedProduct.regularPrice,
                  hasOffer: !!relatedOffer,
                  offerDetails: relatedOffer ? {
                      type: relatedOffer.discountType,
                      value: relatedOffer.discountValue,
                      name: relatedOffer.offerName
                  } : null
              };
          }));
  
          // Check login status
          let isLoggedIn = false;
          if (userId) {
              const userData = await User.findOne({ _id: userId, isBlocked: false });
              if (userData) {
                  isLoggedIn = true;
              }
          }
        console.log(product)
          return res.render('details', { 
              isLoggedIn, 
              products:product,
              relatedProducts,
              countCart: res.locals.cartCount
          });
  
      } catch (error) {
          console.error('Error rendering product details page:', error);
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
