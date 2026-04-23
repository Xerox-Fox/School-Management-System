function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const accounts = [
    { email: "student1@test.com", password: "123456", role: "student" },
    { email: "teacher1@test.com", password: "123456", role: "teacher" },
    { email: "parent1@test.com", password: "123456", role: "parent" },
    { email: "root@test.com", password: "123456", role: "root" }
  ];

  const user = accounts.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("user_type", user.role);
  localStorage.setItem("user_email", user.email);

  if (user.role === "student") window.location.href = "../student/sdash.html";
  if (user.role === "teacher") window.location.href = "../teacher/tdash.html";
  if (user.role === "parent") window.location.href = "../parent/pdash.html";
  if (user.role === "root") window.location.href = "../root/rdash.html";
}