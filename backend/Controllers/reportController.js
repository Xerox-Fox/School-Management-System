const db = require("../Data/dbConfig");

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

        // 1. Find the parent linked to this student by their name
        // We join 'users' and 'students' to find the parent_id
        const studentInfo = await db.prepare(
            `SELECT s.parent_id, u.userid as student_id 
             FROM users u 
             JOIN students s ON u.userid = s.student_id 
             WHERE u.name = ?`).get(name);

        if (!studentInfo || !studentInfo.parent_id) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                msg: "Could not find a student with that name or a linked parent." 
            });
        }

        // 2. Save the report to the 'reason' table
        const query = `
            INSERT INTO reason 
            (name, grade, reason, full_reason, importancy, parent_id, student_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.prepare(query).run(
            name,
            grade,
            reason,
            full_reason,
            importancy,
            studentInfo.parent_id,
            studentInfo.student_id
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "Parental Consultation filed successfully.",
            student: name,
            parent_notified: true
        });

    } catch (error) {
        if (error.message.includes("Check constraint failed")) {
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

module.exports = { report };