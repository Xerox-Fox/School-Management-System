document.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector("body"),
          sidebar = body.querySelector(".sidebar"),
          toggle = body.querySelector(".toggle"),
          navLinks = body.querySelectorAll(".nav-link");

    // 1. Sidebar Toggle
    if (toggle) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("close");
        });
    }

    // 2. User Profile Display
    const displayName = localStorage.getItem("name") || localStorage.getItem("fullname");
    const displayRole = localStorage.getItem("user_type");
    const displayId = localStorage.getItem("display_id");

    const nameElement = document.getElementById("user-name");
    const roleElement = document.getElementById("user-role");

    if (nameElement && displayName) nameElement.innerText = displayName;
    if (roleElement && displayRole) {
        const idTag = displayId ? ` (${displayId})` : "";
        roleElement.innerText = displayRole.charAt(0).toUpperCase() + displayRole.slice(1) + idTag;
    }

    // --- NEW: INITIAL STATE FIX ---
    // This forces the app to start at #home regardless of HTML classes
    function initView() {
        // Hide all sections first
        document.querySelectorAll(".main-content > div").forEach(div => {
            div.classList.remove("active");
            div.style.display = "none";
        });

        // Show the Home div specifically
        const homeSection = document.getElementById("home");
        if (homeSection) {
            homeSection.classList.add("active");
            homeSection.style.display = "block";
        }

        // Set the sidebar link for home to active
        navLinks.forEach(l => l.classList.remove("active"));
        const homeNavLink = Array.from(navLinks).find(link => 
            link.querySelector("a").getAttribute("href") === "#home"
        );
        if (homeNavLink) homeNavLink.classList.add("active");
    }

    // Run the reset
    initView();

    // 3. Section Navigation Logic
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const anchor = link.querySelector("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            e.preventDefault();
            const targetId = href.substring(1);

            // UI State Management
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            document.querySelectorAll(".main-content > div").forEach(div => {
                div.classList.remove("active");
                div.style.display = "none";
            });

            const activeSection = document.getElementById(targetId);
            if (activeSection) {
                activeSection.classList.add("active");
                activeSection.style.display = (targetId === 'news') ? "flex" : "block";
                
                // Trigger Data Loads
                if (targetId === "news") renderNews();
                if (targetId === "grades") fetchMyGrades();
            }
        });
    });

    // 4. Initialize Background Tasks
    checkNotifications();
    setInterval(checkNotifications, 120000); 
});

// --- KEEP YOUR EXISTING DATA FETCHING FUNCTIONS (fetchMyGrades, checkNotifications, renderNews) BELOW ---

// 4. News Rendering (GET Request)
async function renderNews() {
    const container = document.getElementById("news-posts-container");
    const token = localStorage.getItem("token");
    if (!container) return;

    try {
        const response = await fetch("http://localhost:3000/api/blog/see-posts", {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
            }
        });

        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const posts = await response.json();
        container.innerHTML = "";

        if (!posts || posts.length === 0) {
            container.innerHTML = "<p class='loader'>No posts available.</p>";
            return;
        }

        posts.forEach(post => {
            let images = [];
            try { images = JSON.parse(post.image_url || "[]"); } catch (e) { images = []; }

            const card = document.createElement("div");
            card.className = "post-card fade-in";
            card.innerHTML = `
                <div class="post-header">
                    <div class="user-avatar">${post.author_name ? post.author_name[0] : 'A'}</div>
                    <div class="post-info">
                        <span class="author-name">${post.author_name}</span>
                        <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                </div>
                <div class="post-images ${images.length > 1 ? 'grid-2' : ''}">
                    ${images.map(img => `<img src="http://localhost:3000${img}">`).join('')}
                </div>`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = `<p class='loader'>Error: ${err.message}</p>`;
    }
}

async function loadDropdowns() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("http://localhost:3000/api/users/all", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const users = await response.json();

        // This will print a nice table in your console. 
        // Check the column headers in that table!
        console.table(users); 

        const studentSelect = document.getElementById("studentSelect");
        if (!studentSelect) return;

        // Filter for students
        const students = users.filter(u => u.user_type === 'student');
        
        if (students.length === 0) {
            studentSelect.innerHTML = '<option value="" disabled>No students found</option>';
            return;
        }

        studentSelect.innerHTML = '<option value="" disabled selected>Select Student</option>';
        
        students.forEach(s => {
            // Forcefully find the ID and Name by checking every possible key
            const id = s.userid || s.id || s._id || Object.values(s)[0]; 
            const name = s.name || s.fullname || s.display_name || s.username || "Still Unknown";
            const displayId = s.display_id || "";

            studentSelect.innerHTML += `<option value="${id}">${name} ${displayId ? `(${displayId})` : ""}</option>`;
        });

    } catch (err) {
        console.error("Dropdown Update Error:", err);
    }
}

// 6. Grade Form Submission
const gradeForm = document.getElementById("gradeForm");
if (gradeForm) {
    gradeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const teacherSubject = localStorage.getItem("subject");

        if (!teacherSubject) {
            alert("Error: No subject assigned to your teacher profile. Please contact Admin.");
            return;
        }

        const payload = {
            student_id: document.getElementById("studentSelect").value,
            subject_id: teacherSubject, // Injected from localStorage
            semester: parseInt(document.getElementById("semesterSelect").value),
            assessment_mark: parseFloat(document.getElementById("assessMark").value),
            exam_mark: parseFloat(document.getElementById("examMark").value)
        };

        try {
            const response = await fetch("http://localhost:3000/api/results/addgrade", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Success: Grade for ${teacherSubject} saved!`);
                gradeForm.reset();
            } else {
                alert("Error: " + data.msg);
            }
        } catch (err) { 
            console.error(err); 
            alert("Connection error.");
        }
    });
}