export const gradesDB = {
  student1: [
    { subject: "Math", assessment: 35, exam: 55 },
    { subject: "Physics", assessment: 32, exam: 50 },
    { subject: "English", assessment: 38, exam: 52 }
  ]
};

export function getGrades(studentKey) {
  return gradesDB[studentKey] || [];
}