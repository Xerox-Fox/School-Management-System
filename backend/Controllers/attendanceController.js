async function markAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'teacher') {
        return res.status(403).json({ msg: "Only teachers can mark attendance" });
    }

    const { status } = req.body;
    const teacher_id = req.user.userid;
    const date = new Date().toISOString().split('T')[0];

    try {
        // Prevent duplicate attendance for same day
        const existing = await db.prepare(
            "SELECT * FROM attendance WHERE teacher_id = ? AND date = ?"
        ).get(teacher_id, date);

        if (existing) {
            return res.status(400).json({ msg: "Attendance already submitted today" });
        }

        await db.prepare(
            "INSERT INTO attendance (teacher_id, date, status) VALUES (?, ?, ?)"
        ).run(teacher_id, date, status);

        res.status(201).json({ msg: "Attendance recorded" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Database error" });
    }
}

async function getAllAttendance(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(403).json({ msg: "Access denied" });
    }

    try {
        const records = db.prepare(`
            SELECT a.*, u.fullname
            FROM attendance a
            JOIN users u ON a.teacher_id = u.userid
            ORDER BY a.date DESC
        `).all();

        return res.json(records);

    } catch (err) {
        console.error("Attendance Fetch Error:", err.message);
        return res.status(500).json({
            msg: "Failed to fetch attendance",
            error: err.message
        });
    }
}

module.exports = { markAttendance, getAllAttendance };