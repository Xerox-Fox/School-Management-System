const db = require("../Data/dbConfig");
const ROLES = require("./roles");
const { StatusCodes } = require("http-status-codes");

function report(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Access denied. Only root users can file reports."
        });
    }

    const { name, grade, reason, full_reason, importancy } = req.body;

    if (!name || !grade || !reason || !full_reason || !importancy) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            msg: "Please provide all required information" 
        });
    }

    try {
        // Get student ID from name
        const student = db.prepare(`
            SELECT userid FROM users WHERE name = ?
        `).get(name);

        if (!student) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "Student not found"
            });
        }

        db.prepare(`
            INSERT INTO reason 
            (st_id, name, grade, reason, full_reason, importancy) 
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            student.userid,
            name,
            grade,
            reason,
            full_reason,
            importancy
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "Report saved successfully"
        });

    } catch (error) {
        console.error("Report Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to save report"
        });
    }
}

function getParentReports(req, res) {
    const userRole = req.user.user_type;

    // convert string → number IF needed
    const roleValue =
        typeof userRole === "string"
            ? {
                root: 1,
                teacher: 2,
                student: 3,
                parent: 4
            }[userRole.toLowerCase()]
            : userRole;

    if (roleValue !== ROLES.PARENT) {
        return res.status(403).json({ msg: "Access denied. Parents only." });
    }

    try {
        const parent_id = req.user.userid;

        const reports = db.prepare(`
            SELECT 
                r.*,
                stu.name AS student_fullname,
                par.name AS parent_fullname
            FROM reason r
            JOIN students s ON r.st_id = s.student_id
            JOIN users stu ON stu.userid = s.student_id
            JOIN users par ON par.userid = s.parent_id
            WHERE s.parent_id = ?
            ORDER BY r.res_id DESC
        `).all(parent_id);

        if (!reports.length) {
            return res.status(404).json({
                msg: "No reports found for your child."
            });
        }

        // Format names (first name parent, last name student)
        const formatted = reports.map(r => {
            const parentFirst = r.parent_fullname.split(" ")[0];
            const studentLast = r.student_fullname.split(" ").slice(-1).join(" ");

            return {
                parent: parentFirst,
                child: studentLast,
                grade: r.grade,
                reason: r.reason,
                full_reason: r.full_reason,
                importancy: r.importancy,
                created_at: r.res_id
            };
        });

        return res.status(200).json(formatted);

    } catch (error) {
        console.error("Parent Report Error:", error);
        return res.status(500).json({
            msg: "Failed to fetch reports"
        });
    }
}

module.exports = { report, getParentReports };