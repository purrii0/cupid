// Enhanced signup & login logic for production

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {registrationSchema, loginSchema} = require("../schema/schema.js");
const connection = require("../config/db.js");
const userModel = require("../models/user.model.js");

require("dotenv").config();

// Email transporter configuration
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail', // You can change this to your email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Check if user exists
        const user = await userModel.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not
            return res.status(200).json({
                success: true,
                message: "If an account with this email exists, a password reset link has been sent."
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await connection.execute(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), used = FALSE',
            [user.id, resetToken, resetTokenExpiry]
        );

        // Send reset email (only if email is configured)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = createEmailTransporter();
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset - Cupid',
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the link below to reset your password:</p>
                    <a href="${resetUrl}" style="background-color: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        return res.status(200).json({
            success: true,
            message: "If an account with this email exists, a password reset link has been sent."
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Find valid token
        const [tokens] = await connection.execute(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        const resetRecord = tokens[0];

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, resetRecord.user_id]
        );

        // Mark token as used
        await connection.execute(
            'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
            [resetRecord.id]
        );

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully"
        });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const signup = async (req, res) => {
    try {
        // Validate input data
        const parsedData = registrationSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsedData.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }
        
        const {name, email, password, age, gender, city } = parsedData.data;        
        
        // Check if user already exists
        const existingUser = await userModel.findByEmail(email);
        if(existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }
        
        // Hash password with higher salt rounds for production
        const salt = await bcrypt.genSalt(12);
        const hashPassword = await bcrypt.hash(password, salt);
    
        // Create user
        const userId = await userModel.create({
            name, 
            email, 
            password: hashPassword, 
            age, 
            gender, 
            city
        });

        // Create initial profile info
        await connection.execute(      
            "INSERT INTO profile_info (user_id, profile_complete_percentage) VALUES (?, ?)",
            [userId, 20] // Basic info gives 20% completion
        );
        
        console.log(`✅ New user registered: ${email} (ID: ${userId})`);
        
        return res.status(201).json({
            success: true,
            message: "Account created successfully! Please login to continue.",
            user: {
                id: userId,
                name,
                email
            }
        });
    } catch(err) {
        console.error("❌ Registration error:", err);
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

const signin = async (req, res) => {
    try {
        // Validate input data
        const parsedData = loginSchema.safeParse(req.body);
        if(!parsedData.success) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid email and password",
                errors: parsedData.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }
        
        const {email, password} = parsedData.data;
        
        // Find user by email
        const user = await userModel.findByEmail(email);
        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
    
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword) {
            console.log(`⚠️ Failed login attempt for: ${email}`);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        
        // Generate JWT token with more user info and expiration
        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        const token = jwt.sign(
            tokenPayload, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // Token expires in 7 days
        );
        
        // Get profile completion percentage
        const [profileInfo] = await connection.execute(
            "SELECT profile_complete_percentage FROM profile_info WHERE user_id = ?",
            [user.id]
        );
        
        const profileCompletion = profileInfo[0]?.profile_complete_percentage || 0;
        
        console.log(`✅ Successful login: ${email} (ID: ${user.id})`);
        
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
                city: user.city,
                profileCompletion: profileCompletion
            }
        });
    } catch(err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

module.exports = {signup, signin, requestPasswordReset, resetPassword};
