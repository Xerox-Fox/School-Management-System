const db = require('../Data/dbConfig');
const { StatusCodes } = require('http-status-codes');


/* ---------------- INSERT / UPDATE GRADE ---------------- */
async function insertGrade(req, res) {
    try {
        if (!req.user || req.user.user_type !== 'teacher') {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: "Access denied. Only teachers can insert grades."
            });
        }

        const { student_id, subject_id, semester, assessment_mark, exam_mark } = req.body;

        if (
            !student_id ||
            !subject_id ||
            !semester ||
            assessment_mark === undefined ||
            exam_mark === undefined
        ) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Please provide all grade details"
            });
        }

        const total_mark =
            parseFloat(assessment_mark) + parseFloat(exam_mark);

        // 🔍 CHECK EXISTING RECORD
        const existing = await db.query(
            `SELECT result_id 
             FROM results 
             WHERE student_id = $1 AND subject_id = $2 AND semester = $3`,
            [student_id, subject_id, semester]
        );

        if (existing.rows.length > 0) {
            // 🔄 UPDATE
            await db.query(
                `UPDATE results 
                 SET assessment_mark = $1,
                     exam_mark = $2,
                     total_mark = $3
                 WHERE result_id = $4`,
                [
                    assessment_mark,
                    exam_mark,
                    total_mark,
                    existing.rows[0].result_id
                ]
            );

            return res.status(StatusCodes.OK).json({
                msg: "Grade updated successfully"
            });
        }

        // ➕ INSERT
        await db.query(
            `INSERT INTO results 
             (student_id, subject_id, semester, assessment_mark, exam_mark, total_mark)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                student_id,
                subject_id,
                semester,
                assessment_mark,
                exam_mark,
                total_mark
            ]
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "Grade inserted successfully"
        });

    } catch (error) {
        console.error("Insert Grade Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Database error",
            error: error.message
        });
    }
}


/* ---------------- GET MY GRADES (STUDENT) ---------------- */
async function getMyGrades(req, res) {
    try {
        const student_id = req.user.userid;

        const result = await db.query(
            `SELECT r.*, s.subject_name 
             FROM results r
             JOIN subjects s ON r.subject_id = s.subject_id
             WHERE r.student_id = $1
             ORDER BY r.semester ASC`,
            [student_id]
        );

        return res.status(StatusCodes.OK).json(result.rows);

    } catch (error) {
        console.error("Get My Grades Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error fetching grades"
        });
    }
}


/* ---------------- GET CHILD GRADES (PARENT) ---------------- */
async function getChildGrades(req, res) {
    try {
        if (req.user.user_type !== 'parent') {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: "Access restricted to parents."
            });
        }

        // 🔍 GET CHILD
        const student = await db.query(
            `SELECT student_id 
             FROM students 
             WHERE parent_id = $1`,
            [req.user.userid]
        );

        if (student.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "No student linked to this parent account."
            });
        }

        const student_id = student.rows[0].student_id;

        // 📊 GET GRADES
        const grades = await db.query(
            `SELECT r.*, s.subject_name 
             FROM results r
             JOIN subjects s ON r.subject_id = s.subject_id
             WHERE r.student_id = $1`,
            [student_id]
        );

        return res.status(StatusCodes.OK).json(grades.rows);

    } catch (error) {
        console.error("Get Child Grades Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Database error while fetching child grades."
        });
    }
}

module.exports = { insertGrade, getMyGrades, getChildGrades };