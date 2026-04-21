const supabase = require("../Data/dbConfig");
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
        const { data: student, error: fetchError } = await supabase
            .from('users')
            .select('userid')
            .eq('name', name)
            .maybeSingle();

        if (fetchError || !student) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Student not found" });
        }

        // Insert report into 'reason' table
        const { error: insertError } = await supabase
            .from('reason')
            .insert([{
                st_id: student.userid,
                name,
                grade,
                reason,
                full_reason,
                importancy
            }]);

        if (insertError) throw insertError;

        return res.status(StatusCodes.CREATED).json({ msg: "Report saved successfully" });

    } catch (error) {
        console.error("Report Error:", error);
        return res.status(500).json({ msg: "Failed to save report", error: error.message });
    }
}

/* ---------------- GET PARENT REPORTS ---------------- */
async function getParentReports(req, res) {
    try {
        const userRole = req.user.user_type?.toLowerCase();
        const roleMap = { root: 1, teacher: 2, student: 3, parent: 4 };

        if (roleMap[userRole] !== ROLES.PARENT) {
            return res.status(403).json({ msg: "Access denied. Parents only." });
        }

        const parent_id = req.user.userid;

        // JOINS in Supabase: Use nested select syntax
        // This looks into the 'reason' table, joins 'students' via 'st_id', 
        // then reaches into the 'users' table to get names.
        const { data: reports, error } = await supabase
            .from('reason')
            .select(`
                *,
                students!inner (
                    parent_id,
                    student:users!st_id ( name ),
                    parent:users!parent_id ( name )
                )
            `)
            .eq('students.parent_id', parent_id)
            .order('res_id', { ascending: false });

        if (error) throw error;

        if (!reports || reports.length === 0) {
            return res.status(404).json({ msg: "No reports found for your child." });
        }

        // Format the data to match your frontend's expectations
        const formatted = reports.map(r => {
            const studentName = r.students?.student?.name || "";
            const parentName = r.students?.parent?.name || "";

            return {
                parent: parentName.split(" ")[0],
                child: studentName.split(" ").slice(-1).join(" "),
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
        return res.status(500).json({ msg: "Failed to fetch reports", error: error.message });
    }
}

module.exports = { report, getParentReports };