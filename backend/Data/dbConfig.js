const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');


const db = new Database(path.join(__dirname, 'database.db'));

// const db = new Database(path.join(__dirname, 'database.db'));



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
  UPDATE users
  SET user_type = LOWER(TRIM(user_type));
`;

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

const attendance = `
CREATE TABLE IF NOT EXISTS attendance (
    att_id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Present', 'Absent', 'Late')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(userid)
);
`;



try {
  db.exec(users);
  console.log("users table created");

  db.exec(classes);
  console.log("classes table created");

  db.exec(students);
  console.log("students table created");

  db.exec(subjects);
  console.log("subjects table created");

  db.exec(results);
  console.log("results table created");

  db.exec(class_subjects);
  console.log("class_subjects table created");

  db.exec(blogPosts);
  console.log("blogPosts table created");

  db.exec(reason);
  console.log("reasons table created");

  db.exec(attendance);
  console.log("attendance table created");



  const ROOT_EMAIL = 'LCCS@gmail.com';
  const ROOT_PHONE = '+251911000001';
  const ROOT_NAME = 'System Administrator';
  const ROOT_PASSWORD_PLAIN = 'LCCSroot2026!Secure';

  const existingRoot = db.prepare(
    'SELECT userid FROM users WHERE email = ? OR user_type = ?'
  ).get(ROOT_EMAIL, 'root');

  if (!existingRoot) {
    console.log("Creating initial ROOT account...");

    const hashedPassword = bcrypt.hashSync(ROOT_PASSWORD_PLAIN, 12);

    db.prepare(`
      INSERT INTO users (display_id, name, email, password, phone, user_type)
      VALUES (?, ?, ?, ?, ?, 'root')
    `).run(
      'ROOT',
      ROOT_NAME,
      ROOT_EMAIL,
      hashedPassword,
      ROOT_PHONE
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

} catch (err) {
  console.error("Database initialization failed", err);
}


module.exports = db;