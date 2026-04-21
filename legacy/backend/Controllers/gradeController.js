const supabase = require('../Data/dbConfig');
const { StatusCodes } = require('http-status-codes');

/* ---------------- INSERT / UPDATE GRADE (UPSERT) ---------------- */
async function insertGrade(req, res) {
    try {
        if (!req.user || req.user.user_type !== 'teacher') {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: "Access denied. Only teachers can insert grades."
            });
        }

        const { student_id, subject_id, semester, assessment_mark, exam_mark } = req.body;

        if (!student_id || !subject_id || !semester || assessment_mark === undefined || exam_mark === undefined) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide all grade details" });
        }

        const total_mark = parseFloat(assessment_mark) + parseFloat(exam_mark);

        // Supabase .upsert() automatically checks if a record exists.
        // It uses your table's Primary Key or a Unique Constraint to decide.
        const { data, error } = await supabase
            .from('results')
            .upsert({
                student_id,
                subject_id,
                semester,
                assessment_mark,
                exam_mark,
                total_mark
            }, { 
                onConflict: 'student_id, subject_id, semester' 
            })
            .select();

        if (error) throw error;

        return res.status(StatusCodes.OK).json({
            msg: "Grade saved successfully",
            data
        });

    } catch (error) {
        console.error("Insert Grade Error:", error);
        return res.status(500).json({ msg: "Database error", error: error.message });
    }
}

/* ---------------- GET MY GRADES (STUDENT) ---------------- */
async function getMyGrades(req, res) {
    try {
        const student_id = req.user.userid;

        const { data, error } = await supabase
            .from('results')
            .select(`
                *,
                subjects ( subject_name )
            `)
            .eq('student_id', student_id)
            .order('semester', { ascending: true });

        if (error) throw error;

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ msg: "Error fetching grades" });
    }
}

/* ---------------- GET CHILD GRADES (PARENT) ---------------- */
async function getChildGrades(req, res) {
    try {
        if (req.user.user_type !== 'parent') {
            return res.status(403).json({ msg: "Access restricted to parents." });
        }

        // 1. Get the linked child ID
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('student_id')
            .eq('parent_id', req.user.userid)
            .maybeSingle();

        if (studentError || !student) {
            return res.status(404).json({ msg: "No student linked to this parent account." });
        }

        // 2. Get grades with the subject name join
        const { data: grades, error: gradeError } = await supabase
            .from('results')
            .select(`
                *,
                subjects ( subject_name )
            `)
            .eq('student_id', student.student_id);

        if (gradeError) throw gradeError;

        return res.status(200).json(grades);

    } catch (error) {
        return res.status(500).json({ msg: "Database error while fetching child grades." });
    }
}

module.exports = { insertGrade, getMyGrades, getChildGrades };