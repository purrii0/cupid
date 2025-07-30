// Enhanced user management for production

const connection = require("../config/db.js");
const userModel = require("../models/user.model.js");
const { profileUpdateSchema } = require("../schema/schema.js");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require("dotenv").config();

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/profiles');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp and user ID
        const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Photo upload endpoint
const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;
        const photoUrl = `/uploads/profiles/${req.file.filename}`;

        // Update user's profile with new photo URL
        await connection.execute(
            'INSERT INTO profile_info (user_id, photo_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE photo_url = VALUES(photo_url)',
            [userId, photoUrl]
        );

        return res.status(200).json({
            success: true,
            message: 'Photo uploaded successfully',
            photo_url: photoUrl
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all users except current user for discovery
const getUsers = async (req, res) => {
    try {
        const userId = req.user?.id;
        let query = `
            SELECT u.id, u.name, u.age, u.gender, u.city, p.photo_url, p.bio, p.occupation 
            FROM users u 
            LEFT JOIN profile_info p ON u.id = p.user_id
            WHERE u.account_paused = FALSE
        `;
        let params = [];
        
        if (userId) {
            // Exclude current user, blocked users, and users who blocked current user
            query += ` AND u.id != ? 
                       AND u.id NOT IN (
                           SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
                       )
                       AND u.id NOT IN (
                           SELECT blocker_id FROM blocked_users WHERE blocked_id = ?
                       )
                       AND u.id NOT IN (
                           SELECT user1_id FROM swipes WHERE user2_id = ? AND is_like = FALSE
                       )
                       AND u.id NOT IN (
                           SELECT user2_id FROM swipes WHERE user1_id = ? AND is_like = FALSE
                       )`;
            params.push(userId, userId, userId, userId, userId);
        }
        
        query += " ORDER BY u.created_at DESC LIMIT 20";
        
        const [users] = await connection.execute(query, params);
        
        // Add default photo if none exists
        const usersWithDefaults = users.map(user => ({
            ...user,
            photo_url: user.photo_url || 'assets/images/default-avatar.png',
            bio: user.bio || 'No bio available yet.',
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
        // Validate input data
        const parsedData = profileUpdateSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsedData.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }
        const userId = req.user.id;
        const {
            name, age, city, bio, hobbies, preferences,
            height, education, occupation, relationship_status,
            looking_for, about_me, location
        } = parsedData.data;
        
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

// Get user settings
const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                show_distance,
                show_age,
                max_distance,
                notifications_matches,
                notifications_messages,
                notifications_likes,
                notifications_profile_views,
                notifications_email,
                account_paused
            FROM users 
            WHERE id = ?
        `;

        const [rows] = await db.execute(query, [userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ settings: rows[0] });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
};

// Update user settings
const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            show_distance,
            show_age,
            max_distance,
            notifications_matches,
            notifications_messages,
            notifications_likes,
            notifications_profile_views,
            notifications_email
        } = req.body;

        const query = `
            UPDATE users SET
                show_distance = COALESCE(?, show_distance),
                show_age = COALESCE(?, show_age),
                max_distance = COALESCE(?, max_distance),
                notifications_matches = COALESCE(?, notifications_matches),
                notifications_messages = COALESCE(?, notifications_messages),
                notifications_likes = COALESCE(?, notifications_likes),
                notifications_profile_views = COALESCE(?, notifications_profile_views),
                notifications_email = COALESCE(?, notifications_email),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await db.execute(query, [
            show_distance,
            show_age,
            max_distance,
            notifications_matches,
            notifications_messages,
            notifications_likes,
            notifications_profile_views,
            notifications_email,
            userId
        ]);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        // Get current password hash
        const [userRows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Pause account
const pauseAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute(
            'UPDATE users SET account_paused = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );

        res.json({ message: 'Account paused successfully' });
    } catch (error) {
        console.error('Error pausing account:', error);
        res.status(500).json({ error: 'Failed to pause account' });
    }
};

// Reactivate account
const reactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute(
            'UPDATE users SET account_paused = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );

        res.json({ message: 'Account reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating account:', error);
        res.status(500).json({ error: 'Failed to reactivate account' });
    }
};

// Delete account
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { confirmPassword } = req.body;

        if (!confirmPassword) {
            return res.status(400).json({ error: 'Password confirmation required' });
        }

        // Get current password hash
        const [userRows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(confirmPassword, userRows[0].password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Password is incorrect' });
        }

        // Delete user (cascades to related tables)
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

module.exports = {
    getUsers,
    getUserProfile,
    updateProfile,
    getUserStats,
    uploadPhoto,
    upload,
    getSettings,
    updateSettings,
    changePassword,
    pauseAccount,
    reactivateAccount,
    deleteAccount
};
