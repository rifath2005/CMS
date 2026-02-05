import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Pool } from 'pg';
import { config } from './env';
import { AuthService } from '../services/auth/AuthService';
import { UserRole } from '../types';
import { InstitutionModel } from '../models/Institution';
import { UserModel } from '../models/User';

export const configurePassport = (pool: Pool) => {
  const authService = new AuthService(pool);
  const institutionModel = new InstitutionModel(pool);
  const userModel = new UserModel(pool);

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId || 'dummy-client-id',
        clientSecret: config.google.clientSecret || 'dummy-client-secret',
        callbackURL: config.google.callbackUrl,
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'Google User';
          const googleId = profile.id;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user already exists by googleId
          let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
          
          if (userResult.rows.length > 0) {
            return done(null, userResult.rows[0]);
          }

          // Check by email if user exists but hasn't linked Google
          userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
          
          if (userResult.rows.length > 0) {
            // Link Google account
            const existingUser = userResult.rows[0];
            await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, existingUser.id]);
            existingUser.googleId = googleId;
            return done(null, existingUser);
          }

          // If user doesn't exist, check institutional email requirements
          const institution = await institutionModel.validateInstitutionalEmail(email);
          if (!institution) {
            return done(new Error('Please use your institutional email address to sign up.'), null);
          }

          // Create new user
          const newUser = await userModel.create(
            email,
            name,
            UserRole.USER,
            institution.id,
            undefined, // No password for Google users
            googleId
          );
          
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
