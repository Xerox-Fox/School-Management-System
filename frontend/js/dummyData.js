export const users = [
  { id: 1, name: "Student 1", role: "student", email: "student1@mail.com" },
  { id: 2, name: "Teacher 1", role: "teacher", email: "teacher1@mail.com" },
  { id: 3, name: "Parent 1", role: "parent", email: "parent1@mail.com" },
  { id: 4, name: "Root Admin", role: "root", email: "root@mail.com" },
];

export const news = [
  {
    id: 1,
    title: "School Reopens",
    content: "All students should attend classes from Monday.",
    author: "Admin",
    date: "2026-04-23"
  },
  {
    id: 2,
    title: "Exam Schedule",
    content: "Final exams start next week.",
    author: "Principal",
    date: "2026-04-22"
  }
];

export const grades = {
  student1: [
    { subject: "Math", assessment: 35, exam: 55 },
    { subject: "Physics", assessment: 30, exam: 50 },
    { subject: "English", assessment: 38, exam: 52 }
  ]
};

export const attendance = [
  { date: "2026-04-20", status: "Present" },
  { date: "2026-04-21", status: "Absent" },
  { date: "2026-04-22", status: "Present" }
];

export const reports = [
  {
    id: 1,
    student: "Student 1",
    reason: "Low performance",
    severity: "High"
  }
];