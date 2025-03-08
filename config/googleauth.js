// googleauth.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import dotenv from 'dotenv';
import user from"../models/userSchema.js"
import User from '../models/userSchema.js';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://envriocart.shop/auth/google/callback",
    // passReqToCallback: true
  },
  // function(request, accessToken, refreshToken, profile, done) {
  //   done(null, profile); // Return profile in the done callback
  // }
  async (accessToken, refreshToken, profile,done) => {
    try {
       let user=await User.findOne({googleId:profile.id})
       if(user){
        return done(null,user)
       }
       else{
        user=new User({
          name:profile.displayName,    
          email:profile.emails[0].value,
          googleId:profile.id,
        });
        await user.save();
        return done(null,user);
       }
    } catch (error) {
       return done(error,null)
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser((id, done) => {
 User.findById(id)
 .then(user=>{
  done(null,user)
 })
 .catch(err=>{
  done(err,null)
 })
});


export { passport };
