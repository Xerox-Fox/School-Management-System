const db = require("../Data/dbConfig");
const { StatusCodes } = require("http-status-codes");

// MARK ATTENDANCE (TEACHER)
async function markAttendance(req, res) {
    try {
        if (!req.user || req.user.user_type !== 'teacher') {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: "Only teachers can mark attendance"
            });
        }

        const { status } = req.body;

        if (!status) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Status is required"
            });
        }

        const teacher_id = req.user.userid;
        const date = new Date().toISOString().split('T')[0];

        // 🔄 CHECK DUPLICATE (POSTGRES)
        const existing = await db.query(
            "SELECT * FROM attendance WHERE teacher_id = $1 AND date = $2",
            [teacher_id, date]
        );

        if (existing.rows.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Attendance already submitted today"
            });
        }

        // 🔄 INSERT (POSTGRES)
        await db.query(
            "INSERT INTO attendance (teacher_id, date, status) VALUES ($1, $2, $3)",
            [teacher_id, date, status]
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "Attendance recorded successfully"
        });

    } catch (err) {
        console.error("MARK ATTENDANCE ERROR:", err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Database error",
            error: err.message
        });
    }
}


// GET ALL ATTENDANCE (ROOT)
async function getAllAttendance(req, res) {
    try {
        if (!req.user || req.user.user_type !== 'root') {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: "Access denied"
            });
        }

        // 🔄 POSTGRES QUERY
        const result = await db.query(`
            SELECT 
                a.att_id,
                a.teacher_id,
                a.date,
                a.status,
                a.created_at,
                u.name AS teacher_name,
                u.display_id
            FROM attendance a
            LEFT JOIN users u ON a.teacher_id = u.userid
            ORDER BY a.created_at DESC
        `);

        return res.status(StatusCodes.OK).json(result.rows || []);

    } catch (err) {
        console.error("GET ATTENDANCE ERROR:", err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to fetch attendance",
            error: err.message
        });
    }
}

module.exports = { markAttendance, getAllAttendance };