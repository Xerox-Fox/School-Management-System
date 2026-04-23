const db = require('../Data/dbConfig'); 
const { StatusCodes } = require('http-status-codes');

// 1. INSERT GRADES (Teacher Only)
async function insertGrade(req, res) {
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

    try {
        const connection = await db;
        
        // MySQL: Destructure [rows] and check if rows.length > 0
        const [rows] = await connection.execute(
            `SELECT result_id FROM results WHERE student_id = ? AND subject_id = ? AND semester = ?`,
            [student_id, subject_id, semester]
        );

        if (rows.length > 0) {
            // Update existing record
            await connection.execute(
                `UPDATE results SET assessment_mark = ?, exam_mark = ?, total_mark = ? WHERE result_id = ?`,
                [assessment_mark, exam_mark, total_mark, rows[0].result_id]
            );
            return res.status(StatusCodes.OK).json({ msg: "Grade updated successfully" });
        } else {
            // Insert new record
            await connection.execute(
                `INSERT INTO results (student_id, subject_id, semester, assessment_mark, exam_mark, total_mark) VALUES (?,?,?,?,?,?)`,
                [student_id, subject_id, semester, assessment_mark, exam_mark, total_mark]
            );
            return res.status(StatusCodes.CREATED).json({ msg: "Grade inserted successfully" });
        }
    } catch (error) {
        console.error("MySQL Error:", error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
    }
}

// 2. GET MY GRADES (Student Only)
async function getMyGrades(req, res) {
    const student_id = req.user.userid; 

    try {
        const connection = await db;
        const query = `
            SELECT r.*, s.subject_name 
            FROM results r
            JOIN subjects s ON r.subject_id = s.subject_id
            WHERE r.student_id = ?
            ORDER BY r.semester ASC
        `;
        // Destructure the rows from the result array
        const [myGrades] = await connection.execute(query, [student_id]);
        
        return res.status(StatusCodes.OK).json(myGrades);
    } catch (error) {
        console.error(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching grades" });
    }
}

// 3. GET CHILD GRADES (Parent Only)
async function getChildGrades(req, res) {
    if (req.user.user_type !== 'parent') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access restricted to parents." });
    }

    try {
        const connection = await db;

        // Find the student linked to this parent
        const [students] = await connection.execute(
            `SELECT student_id FROM students WHERE parent_id = ?`,
            [req.user.userid]
        );

        if (students.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No student linked to this parent account." });
        }

        const student_id = students[0].student_id;

        // Fetch grades for that specific student
        const [grades] = await connection.execute(
            `SELECT r.*, s.subject_name 
             FROM results r
             JOIN subjects s ON r.subject_id = s.subject_id
             WHERE r.student_id = ?`,
            [student_id]
        );

        res.status(StatusCodes.OK).json(grades);
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error while fetching child grades." });
    }
}

module.exports = { insertGrade, getMyGrades, getChildGrades };