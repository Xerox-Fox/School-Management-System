const db = require("../Data/dbConfig");

// TEACHER: mark attendance
async function markAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'teacher') {
        return res.status(403).json({ msg: "Only teachers can mark attendance" });
    }

    const { status } = req.body;
    const teacher_id = req.user.userid;
    const date = new Date().toISOString().split('T')[0];

    try {
        const existing = db.prepare(
            "SELECT * FROM attendance WHERE teacher_id = ? AND date = ?"
        ).get(teacher_id, date);

        if (existing) {
            return res.status(400).json({ msg: "Attendance already submitted today" });
        }

        db.prepare(
            "INSERT INTO attendance (teacher_id, date, status) VALUES (?, ?, ?)"
        ).run(teacher_id, date, status);

        return res.status(201).json({ msg: "Attendance recorded" });

    } catch (err) {
        console.error("Mark Attendance Error:", err.message);
        return res.status(500).json({ msg: "Database error", error: err.message });
    }
}


// ROOT: get all attendance
async function getAllAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(403).json({ msg: "Access denied" });
    }

    try {
        const records = db.prepare(`
            SELECT 
                a.teacher_id,
                u.fullname AS teacher_name,
                a.date,
                a.status
            FROM attendance a
            JOIN users u ON a.teacher_id = u.userid
            ORDER BY a.date DESC
        `).all();

        return res.json(records);

    } catch (err) {
        console.error("🔥 Attendance Fetch Error:", err.message);
        return res.status(500).json({ 
            msg: "Database error",
            error: err.message 
        });
    }
}

module.exports = { markAttendance, getAllAttendance };