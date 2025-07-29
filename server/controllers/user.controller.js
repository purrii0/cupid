// Enhanced user management for production

const connection = require("../config/db.js");
const userModel = require("../models/user.model.js");
const { profileUpdateSchema } = require("../schema/schema.js");
require("dotenv").config();

// Get all users except current user for discovery
const getUsers = async (req, res) => {
    try {
        const userId = req.user?.id;
        let query = "SELECT u.id, u.name, u.age, u.gender, u.city, p.photo_url, p.about_me, p.occupation FROM users u LEFT JOIN profile_info p ON u.id = p.user_id";
        let params = [];
        
        if (userId) {
            query += " WHERE u.id != ?";
            params.push(userId);
        }
        
        query += " ORDER BY u.created_at DESC LIMIT 20";
        
        const [users] = await connection.execute(query, params);
        
        // Add default photo if none exists
        const usersWithDefaults = users.map(user => ({
            ...user,
            photo_url: user.photo_url || 'assets/images/default-avatar.png',
            about_me: user.about_me || 'No bio available yet.',
            occupation: user.occupation || 'Not specified'
        }));
        
        return res.status(200).json({
            message: "Users fetched successfully",
            users: usersWithDefaults
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        // If there's a params.id, use that (viewing someone else's profile)
        // Otherwise use the authenticated user's ID (viewing own profile)
        const userId = req.params.id || req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        
        const [users] = await connection.execute(
            `SELECT u.*, p.photo_url, p.height, p.education, p.occupation, 
             p.relationship_status, p.looking_for, p.about_me, p.location,
             p.matches, p.likes, p.profile_complete_percentage
             FROM users u 
             LEFT JOIN profile_info p ON u.id = p.user_id 
             WHERE u.id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const user = users[0];
        // Remove sensitive data
        delete user.password_hash;
        delete user.password;
        
        // Add defaults
        user.photo_url = user.photo_url || 'assets/images/default-avatar.png';
        user.about_me = user.about_me || user.bio || 'No bio available yet.';
        user.matches = user.matches || 0;
        user.likes = user.likes || 0;
        user.profile_complete_percentage = user.profile_complete_percentage || 20;
        user.hobbies = user.hobbies || '';  // This comes from users table
        
        return res.status(200).json({
            message: "Profile fetched successfully",
            user: user
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name, age, city, bio, hobbies, preferences,
            height, education, occupation, relationship_status,
            looking_for, about_me, location
        } = req.body;
        
        // Update users table
        if (name || age || city || bio || hobbies || preferences) {
            const updateFields = [];
            const updateValues = [];
            
            if (name) { updateFields.push('name = ?'); updateValues.push(name); }
            if (age) { updateFields.push('age = ?'); updateValues.push(age); }
            if (city) { updateFields.push('city = ?'); updateValues.push(city); }
            if (bio) { updateFields.push('bio = ?'); updateValues.push(bio); }
            if (hobbies) { updateFields.push('hobbies = ?'); updateValues.push(hobbies); }
            if (preferences) { updateFields.push('preferences = ?'); updateValues.push(JSON.stringify(preferences)); }
            
            updateValues.push(userId);
            
            await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }
        
        // Update or insert profile_info
        if (height || education || occupation || relationship_status || looking_for || about_me || location) {
            const [existing] = await connection.execute(
                'SELECT id FROM profile_info WHERE user_id = ?',
                [userId]
            );
            
            if (existing.length > 0) {
                // Update existing profile_info
                const updateFields = [];
                const updateValues = [];
                
                if (height) { updateFields.push('height = ?'); updateValues.push(height); }
                if (education) { updateFields.push('education = ?'); updateValues.push(education); }
                if (occupation) { updateFields.push('occupation = ?'); updateValues.push(occupation); }
                if (relationship_status) { updateFields.push('relationship_status = ?'); updateValues.push(relationship_status); }
                if (looking_for) { updateFields.push('looking_for = ?'); updateValues.push(looking_for); }
                if (about_me) { updateFields.push('about_me = ?'); updateValues.push(about_me); }
                if (location) { updateFields.push('location = ?'); updateValues.push(location); }
                
                updateValues.push(userId);
                
                await connection.execute(
                    `UPDATE profile_info SET ${updateFields.join(', ')} WHERE user_id = ?`,
                    updateValues
                );
            } else {
                // Insert new profile_info
                await connection.execute(
                    `INSERT INTO profile_info (user_id, height, education, occupation, 
                     relationship_status, looking_for, about_me, location) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, height || null, education || null, occupation || null,
                     relationship_status || null, looking_for || null, about_me || null, location || null]
                );
            }
        }
        
        return res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user stats
        const [statsResult] = await connection.execute(
            `SELECT 
                (SELECT COUNT(*) FROM users WHERE id != ?) as total_users,
                (SELECT COUNT(*) FROM conversations WHERE user1_id = ? OR user2_id = ?) as conversations,
                (SELECT COUNT(*) FROM messages WHERE sender_id = ?) as messages_sent
            `,
            [userId, userId, userId, userId]
        );
        
        const stats = statsResult[0];
        
        return res.status(200).json({
            message: "Stats fetched successfully",
            stats: {
                totalUsers: stats.total_users,
                conversations: stats.conversations,
                messagesSent: stats.messages_sent,
                profileViews: 0, // Placeholder
                matches: 0 // Placeholder
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUserProfile,
    updateProfile,
    getUserStats
};
