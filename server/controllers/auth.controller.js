// Enhanced signup & login logic for production

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {registrationSchema, loginSchema} = require("../schema/schema.js");
const connection = require("../config/db.js");
const userModel = require("../models/user.model.js");

require("dotenv").config();

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

module.exports = {signup, signin};
