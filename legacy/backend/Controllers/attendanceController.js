const supabase = require("../Data/dbConfig");
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
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Status is required" });
        }

        const teacher_id = req.user.userid;
        const date = new Date().toISOString().split('T')[0];

        // 🔍 CHECK DUPLICATE
        const { data: existing, error: checkError } = await supabase
            .from('attendance')
            .select('*')
            .eq('teacher_id', teacher_id)
            .eq('date', date)
            .maybeSingle();

        if (existing) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Attendance already submitted today"
            });
        }

        // ➕ INSERT
        const { error: insertError } = await supabase
            .from('attendance')
            .insert([{ teacher_id, date, status }]);

        if (insertError) throw insertError;

        return res.status(StatusCodes.CREATED).json({
            msg: "Attendance recorded successfully"
        });

    } catch (err) {
        console.error("MARK ATTENDANCE ERROR:", err);
        return res.status(500).json({ msg: "Database error", error: err.message });
    }
}

// GET ALL ATTENDANCE (ROOT)
async function getAllAttendance(req, res) {
    try {
        if (!req.user || req.user.user_type !== 'root') {
            return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied" });
        }

        // 🔍 FETCH WITH JOIN
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                att_id,
                teacher_id,
                date,
                status,
                created_at,
                teacher:users!teacher_id (
                    name,
                    display_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Format to match your previous frontend expectations (flattening the join)
        const formattedData = (data || []).map(row => ({
            ...row,
            teacher_name: row.teacher?.name || 'N/A',
            display_id: row.teacher?.display_id || 'N/A'
        }));

        return res.status(StatusCodes.OK).json(formattedData);

    } catch (err) {
        console.error("GET ATTENDANCE ERROR:", err);
        // CRITICAL: We return an empty array [] on error to prevent the frontend .forEach() crash
        return res.status(500).json([]); 
    }
}

module.exports = { markAttendance, getAllAttendance };