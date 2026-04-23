export let attendance = [
  { date: "2026-04-20", status: "Present" },
  { date: "2026-04-21", status: "Absent" }
];

export function markAttendance(status) {
  attendance.push({
    date: new Date().toISOString().split("T")[0],
    status
  });

  localStorage.setItem("attendance", JSON.stringify(attendance));
}

export function getAttendance() {
  return attendance;
}