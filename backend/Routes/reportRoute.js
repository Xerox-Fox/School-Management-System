const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require("../Data/dbConfig"); // <-- Added this so 'db' works
const { report, getParentReports } = require('../Controllers/reportController');

// ROOT: Files the report
router.post('/report', authMiddleware, report);
router.post('/child-report', authMiddleware, getParentReports);

module.exports = router;