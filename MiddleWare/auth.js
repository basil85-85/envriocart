import User from '../models/userSchema.js';
import Cart from '../models/cartSchema.js';

const userAuth = async (req, res, next) => {
    try {
        let userId = req.session?.passport?.user || req.session.userId;

        if (!userId) {
            return res.status(401).redirect("/");
        }

        const userData = await User.findOne({ _id: userId, isBlocked: false });

        if (!userData) {
            return req.session.destroy((err) => {
                if (err) {
                    console.error("Logout error:", err);
                    return res.status(500).render("404");
                }
                return res.redirect("/");
            });
        }

        req.session.userId = userId; 
        req.user = userData; 

        next();
    } catch (error) {
        console.error("Error in authentication middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        User.findById(req.session.admin)
            .then(data => {
                if (data && data.isAdmin) {
                   
                    return next();
                } else {
      
                    return res.redirect('/admin/login');
                }
            })
            .catch(err => {
                console.error('Error in adminAuth middleware:', err);

                return res.status(500).json("Internal Server Error");
            });
    } else {

        return res.redirect('/admin/login');
    }
};




let checkBan = async (req, res, next) => {
    if (req.session.userId) {
      const email =  req.session?.currentEmail || req.session?.user?.email 
      const user = await User.findOne({ email: email });
      if (user && user.isBlocked) {
        return res.render('404');
      }
      return next();
    }
    return next();
  }
  



const cartCountMiddleware = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const userID = req.session.userId;
            const cart = await Cart.findOne({ userId: userID });
            const cartItemCount = cart ? cart.items.length : 0;
            res.locals.cartCount = cartItemCount;
        } else {
            res.locals.cartCount = 0;
        }
    } catch (error) {
        console.log(`Error fetching cart count: ${error}`);
        res.locals.cartCount = 0;
    }
    next();
};




export default {
    userAuth,
    adminAuth,
    checkBan,
    cartCountMiddleware,
   
};
