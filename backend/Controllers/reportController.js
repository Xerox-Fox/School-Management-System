const db = require("../Data/dbConfig");
const ROLES = require("./roles");
const { StatusCodes } = require("http-status-codes");

/* ---------------- CREATE REPORT (ROOT ONLY) ---------------- */
async function report(req, res) {
    try {
        if (!req.user || req.user.user_type !== "root") {
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

        // Find student by name
        const studentResult = await db.query(
            "SELECT userid FROM users WHERE name = $1",
            [name]
        );

        if (studentResult.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "Student not found"
            });
        }

        const studentId = studentResult.rows[0].userid;

        await db.query(
            `INSERT INTO reason 
            (st_id, name, grade, reason, full_reason, importancy)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [studentId, name, grade, reason, full_reason, importancy]
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "Report saved successfully"
        });

    } catch (error) {
        console.error("Report Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to save report",
            error: error.message
        });
    }
}

/* ---------------- GET PARENT REPORTS ---------------- */
async function getParentReports(req, res) {
    try {
        const userRole = req.user.user_type?.toLowerCase();

        const roleMap = {
            root: 1,
            teacher: 2,
            student: 3,
            parent: 4
        };

        const roleValue = roleMap[userRole];

        if (roleValue !== ROLES.PARENT) {
            return res.status(403).json({
                msg: "Access denied. Parents only."
            });
        }

        const parent_id = req.user.userid;

        const result = await db.query(
            `
            SELECT 
                r.*,
                stu.name AS student_fullname,
                par.name AS parent_fullname
            FROM reason r
            JOIN students s ON r.st_id = s.student_id
            JOIN users stu ON stu.userid = s.student_id
            JOIN users par ON par.userid = s.parent_id
            WHERE s.parent_id = $1
            ORDER BY r.res_id DESC
            `,
            [parent_id]
        );

        const reports = result.rows;

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                msg: "No reports found for your child."
            });
        }

        const formatted = reports.map(r => {
            const parentFirst = r.parent_fullname?.split(" ")[0] || "";
            const studentLast = r.student_fullname?.split(" ").slice(-1).join(" ") || "";

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
            msg: "Failed to fetch reports",
            error: error.message
        });
    }
}

module.exports = { report, getParentReports };