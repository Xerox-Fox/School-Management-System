const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

// ✅ SAFE DB PATH (prevents accidental new DB creation issues)
const db = new Database(path.resolve(__dirname, "../database.db"));

/* ---------------- USERS ---------------- */
const users = `
CREATE TABLE IF NOT EXISTS users (
    userid INTEGER PRIMARY KEY AUTOINCREMENT,
    display_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address TEXT,
    subject TEXT,
    user_type TEXT CHECK(user_type IN ('student', 'teacher', 'parent', 'root')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

/* ---------------- CLASSES ---------------- */
const classes = `
CREATE TABLE IF NOT EXISTS classes (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_level INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    teacher_id INTEGER,
    academic_year TEXT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(userid) ON DELETE CASCADE
);
`;

/* ---------------- STUDENTS ---------------- */
const students = `
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY,
    parent_name TEXT NOT NULL,
    parent_id INTEGER,
    enrollment_date DATE,
    current_class_id INTEGER,
    FOREIGN KEY (student_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES users(userid) ON DELETE SET NULL,
    FOREIGN KEY (current_class_id) REFERENCES classes(class_id) ON DELETE CASCADE
);
`;

/* ---------------- SUBJECTS ---------------- */
const subjects = `
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT NOT NULL
);
`;

/* ---------------- CLASS SUBJECTS ---------------- */
const class_subjects = `
CREATE TABLE IF NOT EXISTS class_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(userid) ON DELETE CASCADE
);
`;

/* ---------------- RESULTS ---------------- */
const results = `
CREATE TABLE IF NOT EXISTS results (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    semester INTEGER CHECK(semester IN (1, 2)),
    assessment_mark REAL,
    exam_mark REAL,
    total_mark REAL,
    FOREIGN KEY (student_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);
`;

/* ---------------- POSTS ---------------- */
const blogPosts = `
CREATE TABLE IF NOT EXISTS posts (
    post_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    FOREIGN KEY (author_id) REFERENCES users(userid) ON DELETE CASCADE
);
`;

/* ---------------- REPORTS ---------------- */
const reason = `
CREATE TABLE IF NOT EXISTS reason (
    res_id INTEGER PRIMARY KEY AUTOINCREMENT,
    st_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    reason TEXT CHECK(reason IN ('Discipline', 'Grade', 'Absent')),
    full_reason TEXT NOT NULL,
    importancy TEXT CHECK(importancy IN ('Medium', 'High')),
    FOREIGN KEY (st_id) REFERENCES users(userid) ON DELETE CASCADE
);
`;

/* ---------------- ATTENDANCE ---------------- */
const attendance = `
CREATE TABLE IF NOT EXISTS attendance (
    att_id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Present', 'Absent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(userid) ON DELETE CASCADE
);
`;

try {
    /* ---------------- EXEC TABLES ---------------- */
    db.exec(users);
    db.exec(classes);
    db.exec(students);
    db.exec(subjects);
    db.exec(results);
    db.exec(class_subjects);
    db.exec(blogPosts);
    db.exec(reason);
    db.exec(attendance);

    console.log("Database tables initialized successfully");

    /* ---------------- ROOT USER ---------------- */
    const ROOT_EMAIL = "LCCS@gmail.com";
    const ROOT_PHONE = "+251911000001";
    const ROOT_NAME = "System Administrator";
    const ROOT_PASSWORD = "LCCSroot2026!Secure";

    const existingRoot = db
        .prepare("SELECT userid FROM users WHERE email = ? OR user_type = ?")
        .get(ROOT_EMAIL, "root");

    if (!existingRoot) {
        console.log("Creating ROOT account...");

        const hashedPassword = bcrypt.hashSync(ROOT_PASSWORD, 12);

        db.prepare(`
            INSERT INTO users (display_id, name, email, password, phone, user_type)
            VALUES (?, ?, ?, ?, ?, 'root')
        `).run(
            "ROOT",
            ROOT_NAME,
            ROOT_EMAIL,
            hashedPassword,
            ROOT_PHONE
        );

        console.log(`
====================================
ROOT ACCOUNT CREATED
Email: ${ROOT_EMAIL}
Password: ${ROOT_PASSWORD}

⚠️ Change this password after login!
====================================
        `);
    } else {
        console.log("Root account already exists");
    }

} catch (err) {
    console.error("Database initialization failed:", err.message);
}

module.exports = db;