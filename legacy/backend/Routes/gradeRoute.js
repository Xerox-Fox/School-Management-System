const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

const { insertGrade, getMyGrades, getChildGrades } = require('../Controllers/gradeController')

router.post('/addgrade', authMiddleware, insertGrade)
router.post('/my-grades', authMiddleware, getMyGrades)
router.post('/child-grades', authMiddleware, getChildGrades)



module.exports = router