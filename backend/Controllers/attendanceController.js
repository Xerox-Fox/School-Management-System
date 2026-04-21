const db = require("../Data/dbConfig");
const { StatusCodes } = require("http-status-codes");

/* -------------------------------
   MARK ATTENDANCE (TEACHER ONLY)
--------------------------------*/
async function markAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'teacher') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Only teachers can mark attendance"
        });
    }

    const { status } = req.body;
    const teacher_id = req.user.userid;
    const date = new Date().toISOString().split('T')[0];

    if (!status) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: "Status is required"
        });
    }

    try {
        // check duplicate
        const existing = db.prepare(
            "SELECT * FROM attendance WHERE teacher_id = ? AND date = ?"
        ).get(teacher_id, date);

        if (existing) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Attendance already submitted today"
            });
        }

        db.prepare(
            `INSERT INTO attendance (teacher_id, date, status)
             VALUES (?, ?, ?)`
        ).run(teacher_id, date, status);

        return res.status(StatusCodes.CREATED).json({
            msg: "Attendance recorded successfully"
        });

    } catch (error) {
        console.error("MARK ATTENDANCE ERROR:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Database error"
        });
    }
}

/* -------------------------------
   GET ALL ATTENDANCE (ROOT ONLY)
--------------------------------*/
async function getAllAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Access denied"
        });
    }

    try {
        const records = db.prepare(`
            SELECT 
                a.att_id,
                a.teacher_id,
                u.name,
                u.display_id,
                a.date,
                a.status,
                a.created_at
            FROM attendance a
            JOIN users u ON a.teacher_id = u.userid
            ORDER BY a.created_at DESC
        `).all();

        return res.status(StatusCodes.OK).json(records);

    } catch (error) {
        console.error("GET ATTENDANCE ERROR:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to fetch attendance"
        });
    }
}

module.exports = {
    markAttendance,
    getAllAttendance
};