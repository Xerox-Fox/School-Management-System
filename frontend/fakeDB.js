// fakeDB.js

export const users = [
  { id: 1, name: "Student One", email: "student1@test.com", role: "student" },
  { id: 2, name: "Teacher One", email: "teacher1@test.com", role: "teacher" },
  { id: 3, name: "Parent One", email: "parent1@test.com", role: "parent" },
  { id: 4, name: "Admin Root", email: "root@test.com", role: "root" }
];

export const grades = [
  { studentEmail: "student1@test.com", subject: "Math", total: 85 },
  { studentEmail: "student1@test.com", subject: "Physics", total: 78 }
];

export const reports = [
  {
    studentEmail: "student1@test.com",
    parent: "Parent One",
    grade: "10A",
    reason: "Absent",
    full_reason: "Missed class without excuse",
    importancy: "High"
  }
];

export let attendance = [
  {
    teacher_name: "Teacher One",
    date: "2026-04-22",
    status: "Present"
  }
];