import User from '../models/userSchema.js';

// Middleware to check user authentication and account status
const userAuth = (req, res, next) => {
    if (req.session.userid) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    return next();
                } else {
                   
                    return res.redirect('/login');
                }
            })
            .catch(err => {
                console.error('Error fetching user:', err);
                // Internal server error
                return res.status(500).json("Internal Server Error");
            });
    } else {

        return res.redirect('/login');
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
  

export default {
    userAuth,
    adminAuth,
    checkBan
   
};
