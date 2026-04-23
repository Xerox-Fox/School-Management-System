const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

const { sendLoginNotification } = require('../Controllers/emailController')

router.post('/addgrade', authMiddleware, sendLoginNotification)




module.exports = router