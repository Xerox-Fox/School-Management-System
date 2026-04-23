const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbconnection = mysql.createPool({
  user: process.env.DB_USER,
  database: process.env.DB_DATA,
  host: process.env.DB_HOST,
  password: process.env.DB_PASS,
  connectionLimit: 10,
  port: process.env.DB_PORT,
});

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

const ROOT_EMAIL = 'LCCS@gmail.com';
const ROOT_PHONE = '+251911000001';
const ROOT_NAME = 'System Administrator';
const ROOT_PASSWORD_PLAIN = 'LCCSroot2026!Secure';

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

const subjects = `
  CREATE TABLE IF NOT EXISTS subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_name TEXT NOT NULL
  );
`;

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

const reason = `
  CREATE TABLE IF NOT EXISTS reason (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    full_reason TEXT NOT NULL,
    importancy ENUM('Low', 'Medium', 'High') NOT NULL,
    parent_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(userid)
);`;

const attendance = `
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
    remark TEXT,
    recorded_by VARCHAR(255), -- The Teacher's ID
    FOREIGN KEY (student_id) REFERENCES users(userid)
);
`;

// Initialize tables
dbconnection.then(async (db) => {
    await db.run(users);
    console.log("user table created");
    
    await db.run(classes);
    console.log("classes table created");
    
    await db.run(students);
    console.log("students table created");
    
    await db.run(subjects);
    console.log("subjects table created");

    
    await db.run(results);
    console.log("results table created");

    await db.run(class_subjects);
    console.log("class_subjects table created");

    await db.run(blogPosts);
    console.log("blogPosts table created");
    
    await db.run(reason);
    console.log("reasons table created");
    await db.run(attendance);
    console.log("attendance table created");
    
    const existingRoot = await db.get(
      'SELECT userid FROM users WHERE email = ? OR user_type = ?',
      [ROOT_EMAIL, 'root']
    );

    if (!existingRoot) {
      console.log("Creating initial ROOT account...");

      const hashedPassword = await bcrypt.hash(ROOT_PASSWORD_PLAIN, 12);

      await db.run(
        `INSERT INTO users (display_id, name, email, password, phone, user_type)
        VALUES (?, ?, ?, ?, ?, 'root')`,
        [
          'ROOT',
          ROOT_NAME,
          ROOT_EMAIL,
          hashedPassword,
          ROOT_PHONE
        ]
      );

      console.log(`
        ROOT ACCOUNT CREATED SUCCESSFULLY!
        Email: ${ROOT_EMAIL}
        Password: ${ROOT_PASSWORD_PLAIN}
        -> Change password immediately after first login!
        -> Delete creation block after first run.
        `);
    } else {
      console.log("Root account already exists - skipping creation.");
    }
}).catch(err => {
    console.error("Database initialization failed", err);
});

module.exports = dbconnection.promise();