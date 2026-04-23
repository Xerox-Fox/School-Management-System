const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require("../Data/dbConfig"); // <-- Added this so 'db' works
const { report, getReportHistory } = require('../Controllers/reportController');

// ROOT: Files the report
router.post('/report', authMiddleware, report);

router.get('/get-report', getReportHistory);


module.exports = router;