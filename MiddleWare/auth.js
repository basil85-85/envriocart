import User from '../models/userSchema.js';

// Middleware to check user authentication and account status
const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    // User exists and is not blocked
                    return next();
                } else {
                    // Redirect to login if user is blocked or not found
                    return res.redirect('/login');
                }
            })
            .catch(err => {
                console.error('Error fetching user:', err);
                // Internal server error
                return res.status(500).json("Internal Server Error");
            });
    } else {
        // Redirect to login if no session
        return res.redirect('/login');
    }
};

// Middleware to check admin authentication
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

// Middleware to prevent logged-in users from accessing login/signup pages
// const guestAuth = (req, res, next) => {
//     if (req.session.user || req.session.admin) {
     
//         return res.redirect('/');
//     } else {
     
//         return next();
//     }
// };


export default {
    userAuth,
    adminAuth,
   
};
