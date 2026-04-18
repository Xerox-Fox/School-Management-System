const isAuth = localStorage.getItem("isAuthenticated");

if (!isAuth) {
  window.location.href = "/login.html";
}

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

    // 3. Initial State Fix
    function initView() {
        document.querySelectorAll(".main-content > div").forEach(div => {
            div.classList.remove("active");
            div.style.display = "none";
        });

        const homeSection = document.getElementById("home");
        if (homeSection) {
            homeSection.classList.add("active");
            homeSection.style.display = "block";
        }

        navLinks.forEach(l => l.classList.remove("active"));
        const homeNavLink = Array.from(navLinks).find(link => 
            link.querySelector("a").getAttribute("href") === "#home"
        );
        if (homeNavLink) homeNavLink.classList.add("active");
    }

    initView();

    // 4. Section Navigation Logic
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const anchor = link.querySelector("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            e.preventDefault();
            const targetId = href.substring(1);

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
                
                if (targetId === "news") renderNews();
                if (targetId === "grades") fetchMyGrades();
            }
        });
    });

    checkNotifications();
    setInterval(checkNotifications, 120000); 
});

// --- DATA FETCHING FUNCTIONS ---

async function renderNews() {
    const container = document.getElementById("news-posts-container");
    const token = localStorage.getItem("token");
    if (!container) return;

    try {
        const response = await fetch("https://lms-backend-zghq.onrender.com/api/blog/see-posts", {
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
            try { 
                // Handle cases where image_url might be a string or already an array
                images = typeof post.image_url === 'string' ? JSON.parse(post.image_url || "[]") : (post.image_url || []); 
            } catch (e) { 
                images = []; 
            }

            const card = document.createElement("div");
            card.className = "post-card fade-in";
            
            // Build image HTML only if images exist
            const imageSection = images.length > 0 ? `
                <div class="post-images ${images.length > 1 ? 'grid-2' : ''}">
                    ${images.map(img => `<img src="http://localhost:3000${img}" alt="Post image">`).join('')}
                </div>` : "";

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
                ${imageSection}`;
            
            container.appendChild(card);
        });
    } catch (err) {
        console.error("News load error:", err);
        container.innerHTML = `<p class='loader'>Error loading news: ${err.message}</p>`;
    }
}

async function fetchMyGrades() {
    const token = localStorage.getItem("token");
    const tableBody = document.getElementById("gradesTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch("https://lms-backend-zghq.onrender.com/api/results/child-grades", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Unable to load grades.</td></tr>`;
            return;
        }

        const data = await response.json(); 
        const grades = data.grades || [];
        tableBody.innerHTML = "";

        if (grades.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No grades recorded yet.</td></tr>`;
            return;
        }

        let totalSum = 0;
        grades.forEach(grade => {
            const total = (grade.assessment_mark || 0) + (grade.exam_mark || 0);
            totalSum += total;

            tableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                    <td style="padding: 15px 10px; font-weight: 500;">${grade.subject_name}</td>
                    <td style="padding: 15px 10px;">${grade.assessment_mark}</td>
                    <td style="padding: 15px 10px;">${grade.exam_mark}</td>
                    <td style="padding: 15px 10px; font-weight: bold; color: #203791;">${total}</td>
                    <td style="padding: 15px 10px;">
                        <span style="background: ${total >= 50 ? '#E3FBE3' : '#FBE3E3'}; 
                                     color: ${total >= 50 ? '#2E7D32' : '#C62828'}; 
                                     padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">
                            ${total >= 50 ? 'Passed' : 'Failed'}
                        </span>
                    </td>
                </tr>`;
        });

        const avgElement = document.getElementById("averageMark");
        if (avgElement) avgElement.innerText = (totalSum / grades.length).toFixed(1);

    } catch (err) {
        console.error("Grades load error:", err);
    }
}

async function checkNotifications() {
    const token = localStorage.getItem("token");
    const notifWindow = document.getElementById("notification-window");
    if (!notifWindow) return;

    try {
        const response = await fetch("https://lms-backend-zghq.onrender.com/api/report-st/my-reports", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;

        const reports = await response.json();
        if (reports.length > 0) {
            const latest = reports[0]; 
            document.getElementById("notif-title").innerText = `New Report: ${latest.reason}`;
            document.getElementById("notif-message").innerText = latest.full_reason;
            
            const priorityColors = { "High": "#ff4d4d", "Medium": "#ffa500", "Low": "#203791" };
            notifWindow.style.borderLeft = `5px solid ${priorityColors[latest.importancy] || "#203791"}`;
            notifWindow.style.display = "block";

            document.getElementById("close-notif").onclick = () => { notifWindow.style.display = "none"; };
        }
    } catch (err) {
        console.error("Notification fetch failed", err);
    }
}