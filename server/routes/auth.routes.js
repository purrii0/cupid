// Authentication routes

const express = require('express');
const router = express.Router();
const { signup, signin, requestPasswordReset, resetPassword } = require('../controllers/auth.controller.js');

// User registration
router.post('/signup', signup);

// User login
router.post('/signin', signin);

// Password reset request
router.post('/request-password-reset', requestPasswordReset);

// Reset password with token
router.post('/reset-password', resetPassword);

module.exports = router;
