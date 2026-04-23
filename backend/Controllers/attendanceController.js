const db = require('../Data/dbConfig');
const { StatusCodes } = require('http-status-codes');

async function submitAttendance(req, res) {
    // 1. Permission Check
    if (req.user.user_type !== 'teacher' && req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
    }

    const { date, attendanceData } = req.body; 
    // attendanceData should be an array: [{student_id: 'STU-001', status: 'Present'}, ...]

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid data provided" });
    }

    try {
        const connection = await db;

        // 2. Map the data into an array of arrays for bulk insert
        const values = attendanceData.map(record => [
            record.student_id,
            date,
            record.status,
            req.user.userid // teacher taking the attendance
        ]);

        // 3. Bulk Insert in MySQL
        const query = `INSERT INTO attendance (student_id, date, status, recorded_by) VALUES ?`;
        
        await connection.query(query, [values]);

        return res.status(StatusCodes.CREATED).json({ msg: "Attendance recorded successfully!" });

    } catch (error) {
        console.error("Attendance Error:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Failed to save attendance" });
    }
}

async function getAttendanceByClass(req, res) {
    const { class_id, date } = req.query;

    try {
        const connection = await db;
        // Join with users to see student names in the report
        const [rows] = await connection.execute(
            `SELECT a.*, u.name 
             FROM attendance a
             JOIN users u ON a.student_id = u.userid
             JOIN students s ON u.userid = s.student_id
             WHERE s.class_id = ? AND a.date = ?`,
            [class_id, date]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ msg: "Error fetching records" });
    }
}

module.exports = { submitAttendance, getAttendanceByClass };