const db = require('../Data/dbConfig');
const { StatusCodes } = require('http-status-codes');

async function report(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Access denied. Only root users can file reports."
        });
    }

    const { name, grade, reason, full_reason, importancy } = req.body;

    if (!name || !grade || !reason || !full_reason || !importancy) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide all required information" });
    }

    try {
        const connection = await db;

        // 1. Find the parent linked to this student by their name
        // In mysql2, query results are returned as [rows, fields]
        const [rows] = await connection.execute(
            `SELECT s.parent_id, u.userid as student_id 
             FROM users u 
             JOIN students s ON u.userid = s.student_id 
             WHERE u.name = ?`, 
            [name]
        );

        // Check if a record exists in the rows array
        if (rows.length === 0 || !rows[0].parent_id) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                msg: "Could not find a student with that name or a linked parent." 
            });
        }

        const studentInfo = rows[0];

        // 2. Save the report to the 'reason' table
        const query = `
            INSERT INTO reason 
            (name, grade, reason, full_reason, importancy, parent_id, student_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
            name,
            grade,
            reason,
            full_reason,
            importancy,
            studentInfo.parent_id,
            studentInfo.student_id
        ]);

        return res.status(StatusCodes.CREATED).json({
            msg: "Parental Consultation filed successfully.",
            student: name,
            parent_notified: true
        });

    } catch (error) {
        // MySQL handles constraints differently than SQLite. 
        // If 'importancy' is an ENUM and fails, it usually throws a specific code.
        if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.message.includes("Check constraint")) {
            return res.status(StatusCodes.BAD_GATEWAY).json({
                msg: "Invalid priority level. Use: Low, Medium, High."
            });
        }
        
        console.error("Report Error:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to save report."
        });
    }
}

async function getReportHistory(req, res) {
    // Only Root should see the full history of all students
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied." });
    }

    try {
        const connection = await db;
        
        // Fetch all reports, joining with users to get the official name if needed
        const [reports] = await connection.execute(
            `SELECT * FROM reason ORDER BY created_at DESC`
        );

        return res.status(StatusCodes.OK).json(reports);
    } catch (error) {
        console.error("History Error:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Failed to fetch records." });
    }
}

module.exports = { report, getReportHistory };