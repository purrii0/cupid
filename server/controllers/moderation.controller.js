// Enhanced moderation system for user blocking and reporting
const connection = require("../config/db.js");
const { blockUserSchema, reportUserSchema } = require("../schema/schema.js");
require("dotenv").config();

const db = connection;

// Block a user
const blockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { blockedUserId, reason } = req.body;

        // Validation
        if (!blockedUserId) {
            return res.status(400).json({ error: 'Blocked user ID is required' });
        }

        if (userId === parseInt(blockedUserId)) {
            return res.status(400).json({ error: 'You cannot block yourself' });
        }

        // Check if user exists
        const [userCheck] = await db.execute('SELECT id FROM users WHERE id = ?', [blockedUserId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already blocked
        const [existingBlock] = await db.execute(
            'SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [userId, blockedUserId]
        );

        if (existingBlock.length > 0) {
            return res.status(400).json({ error: 'User is already blocked' });
        }

        // Insert block record
        await db.execute(
            'INSERT INTO blocked_users (blocker_id, blocked_id, reason) VALUES (?, ?, ?)',
            [userId, blockedUserId, reason || null]
        );

        // Remove any existing matches
        await db.execute(
            'DELETE FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [userId, blockedUserId, blockedUserId, userId]
        );

        // Remove any existing conversations
        await db.execute(
            'DELETE FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [userId, blockedUserId, blockedUserId, userId]
        );

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
};

// Unblock a user
const unblockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { blockedUserId } = req.body;

        if (!blockedUserId) {
            return res.status(400).json({ error: 'Blocked user ID is required' });
        }

        const result = await db.execute(
            'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [userId, blockedUserId]
        );

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ error: 'Block record not found' });
        }

        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
};

// Get blocked users list
const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                bu.id as block_id,
                bu.blocked_id,
                bu.reason,
                bu.created_at as blocked_at,
                u.name,
                u.age,
                pi.photo_url
            FROM blocked_users bu
            JOIN users u ON bu.blocked_id = u.id
            LEFT JOIN profile_info pi ON u.id = pi.user_id
            WHERE bu.blocker_id = ?
            ORDER BY bu.created_at DESC
        `;

        const [rows] = await db.execute(query, [userId]);

        res.json({ blocked_users: rows });
    } catch (error) {
        console.error('Error getting blocked users:', error);
        res.status(500).json({ error: 'Failed to get blocked users' });
    }
};

// Report a user
const reportUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reportedUserId, reason, description } = req.body;

        // Validation
        if (!reportedUserId || !reason) {
            return res.status(400).json({ error: 'Reported user ID and reason are required' });
        }

        if (userId === parseInt(reportedUserId)) {
            return res.status(400).json({ error: 'You cannot report yourself' });
        }

        const validReasons = ['inappropriate_behavior', 'fake_profile', 'harassment', 'spam', 'inappropriate_photos', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ error: 'Invalid reason provided' });
        }

        // Check if user exists
        const [userCheck] = await db.execute('SELECT id FROM users WHERE id = ?', [reportedUserId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already reported by this user
        const [existingReport] = await db.execute(
            'SELECT id FROM user_reports WHERE reporter_id = ? AND reported_id = ? AND status IN ("pending", "reviewed")',
            [userId, reportedUserId]
        );

        if (existingReport.length > 0) {
            return res.status(400).json({ error: 'You have already reported this user' });
        }

        // Insert report record
        await db.execute(
            'INSERT INTO user_reports (reporter_id, reported_id, reason, description) VALUES (?, ?, ?, ?)',
            [userId, reportedUserId, reason, description || null]
        );

        res.json({ message: 'User reported successfully. Thank you for helping keep our community safe.' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ error: 'Failed to report user' });
    }
};

// Check if a user is blocked
const isUserBlocked = async (req, res) => {
    try {
        const userId = req.user.id;
        const { checkUserId } = req.params;

        const [rows] = await db.execute(
            'SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [userId, checkUserId]
        );

        res.json({ is_blocked: rows.length > 0 });
    } catch (error) {
        console.error('Error checking block status:', error);
        res.status(500).json({ error: 'Failed to check block status' });
    }
};

// Get user's reports (for user to see their own reports)
const getUserReports = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                ur.id,
                ur.reported_id,
                ur.reason,
                ur.description,
                ur.status,
                ur.created_at,
                u.name as reported_user_name
            FROM user_reports ur
            JOIN users u ON ur.reported_id = u.id
            WHERE ur.reporter_id = ?
            ORDER BY ur.created_at DESC
        `;

        const [rows] = await db.execute(query, [userId]);

        res.json({ reports: rows });
    } catch (error) {
        console.error('Error getting user reports:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
};

module.exports = {
    blockUser,
    unblockUser,
    getBlockedUsers,
    reportUser,
    isUserBlocked,
    getUserReports
};
