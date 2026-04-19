const db = require('../Data/dbConfig'); 
const { StatusCodes } = require('http-status-codes');


function insertGrade(req, res) {
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
        const existingRecord = db.prepare(
            "SELECT result_id FROM results WHERE student_id = ? AND subject_id = ? AND semester = ?"
        ).get(student_id, subject_id, semester);

        if (existingRecord) {
            db.prepare(
                "UPDATE results SET assessment_mark = ?, exam_mark = ?, total_mark = ? WHERE result_id = ?"
            ).run(assessment_mark, exam_mark, total_mark, existingRecord.result_id);

            return res.status(StatusCodes.OK).json({ msg: "Grade updated successfully" });
        } else {
            db.prepare(
                "INSERT INTO results (student_id, subject_id, semester, assessment_mark, exam_mark, total_mark) VALUES (?,?,?,?,?,?)"
            ).run(student_id, subject_id, semester, assessment_mark, exam_mark, total_mark);

            return res.status(StatusCodes.CREATED).json({ msg: "Grade inserted successfully" });
        }

    } catch (error) {
        console.error("Insert Grade Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
    }
}



function getMyGrades(req, res) {
    const student_id = req.user.userid;

    try {
        const query = `
            SELECT r.*, s.subject_name 
            FROM results r
            JOIN subjects s ON r.subject_id = s.subject_id
            WHERE r.student_id = ?
            ORDER BY r.semester ASC
        `;

        const myGrades = db.prepare(query).all(student_id);

        return res.status(StatusCodes.OK).json(myGrades);

    } catch (error) {
        console.error("Get My Grades Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching grades" });
    }
}



function getChildGrades(req, res) {
    if (req.user.user_type !== 'parent') {
        return res.status(403).json({ msg: "Access restricted to parents." });
    }

    try {
        const studentInfo = db.prepare(
            "SELECT student_id FROM students WHERE parent_id = ?"
        ).get(req.user.userid);

        if (!studentInfo) {
            return res.status(404).json({ msg: "No student linked to this parent account." });
        }

        const grades = db.prepare(`
            SELECT r.*, s.subject_name 
            FROM results r
            JOIN subjects s ON r.subject_id = s.subject_id
            WHERE r.student_id = ?
        `).all(studentInfo.student_id);

        res.status(200).json(grades);

    } catch (error) {
        console.error("Get Child Grades Error:", error);
        res.status(500).json({ msg: "Database error while fetching child grades." });
    }
}

module.exports = { insertGrade, getMyGrades, getChildGrades };