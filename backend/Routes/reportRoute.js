const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require("../Data/dbConfig"); // <-- Added this so 'db' works
const { report } = require('../Controllers/reportController');

// ROOT: Files the report
router.post('/report', authMiddleware, report);

// PARENT: Sees the report for their child
router.get("/my-reports", authMiddleware, async (req, res) => {
    const parentId = req.user.userid; // Extracted from JWT by authMiddleware

    try {
        const connection = await db;
        
        // This query finds the report based on the parent-student link
        const query = `
            SELECT r.* FROM reason r
            JOIN students s ON r.name = (SELECT name FROM users WHERE userid = s.student_id)
            WHERE s.parent_id = ?
            ORDER BY r.id DESC LIMIT 1
        `;
        
        const reports = await connection.all(query, [parentId]);
        
        // Send empty array instead of 404 if no reports exist yet
        res.status(200).json(reports || []);
    } catch (error) {
        console.error("Fetch reports error:", error);
        res.status(500).json({ msg: "Failed to fetch reports" });
    }
});

module.exports = router;