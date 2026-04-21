const express = require('express');
const { markAttendance, getAllAttendance } = require('../Controllers/attendanceController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

router.post('/mark', authMiddleware, markAttendance);
router.get('/all', authMiddleware, getAllAttendance);



module.exports = router