const isAuth = localStorage.getItem("isAuthenticated");

if (!isAuth) {
  window.location.href = "../Login/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector("body"),
          sidebar = body.querySelector(".sidebar"),
          toggle = body.querySelector(".toggle"),
          navLinks = body.querySelectorAll(".nav-link");

    // 1. Sidebar Toggle Fix
    if (toggle) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("close");
        });
    }

    // 2. Student Name & ID Display
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

    // --- INITIAL STATE FIX ---
    // This part ensures that when the page reloads, it starts at #home
    function initView() {
        // 1. Hide all content divs
        document.querySelectorAll(".main-content > div").forEach(div => {
            div.classList.remove("active");
            div.style.display = "none";
        });

        // 2. Show the Home div specifically
        const homeSection = document.getElementById("home");
        if (homeSection) {
            homeSection.classList.add("active");
            homeSection.style.display = "block";
        }

        // 3. Set the Dashboard sidebar link to active
        navLinks.forEach(l => l.classList.remove("active"));
        const homeNavLink = Array.from(navLinks).find(link => 
            link.querySelector("a").getAttribute("href") === "#home"
        );
        if (homeNavLink) homeNavLink.classList.add("active");
    }

    // Run the initialization
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

            // Update Sidebar UI
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // Update Content UI
            document.querySelectorAll(".main-content > div").forEach(div => {
                div.classList.remove("active");
                div.style.display = "none";
            });

            const activeSection = document.getElementById(targetId);
            if (activeSection) {
                activeSection.classList.add("active");
                // Special handling for News feed flex layout
                activeSection.style.display = (targetId === 'news') ? "flex" : "block";
                
                if (targetId === "news") renderNews();
                if (targetId === "grades") fetchMyGrades();
            }
        });
    });
});

// --- REMAINDER OF YOUR FUNCTIONS (renderNews, fetchMyGrades) STAY THE SAME ---

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
            try { images = JSON.parse(post.image_url || "[]"); } catch (e) { images = []; }

            const card = document.createElement("div");
            card.className = "post-card fade-in";
            const imageClass = images.length > 1 ? "post-images grid-2" : "post-images";
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
                <div class="${imageClass}">
                    ${images.map(img => `<img src="https://lms-backend-zghq.onrender.com${img}">`).join('')}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = `<p class='loader'>Error: ${err.message}.</p>`;
    }
}

async function fetchMyGrades() {
    const token = localStorage.getItem("token");
    const tableBody = document.getElementById("gradesTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch("https://lms-backend-zghq.onrender.com/api/results/my-grades", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const grades = await response.json();

        let totalSum = 0;
        tableBody.innerHTML = "";

        grades.forEach(grade => {
            const total = (grade.assessment_mark || 0) + (grade.exam_mark || 0);
            totalSum += total;

            const row = `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                    <td style="padding: 15px 10px; font-weight: 500; color: #333;">${grade.subject_name}</td>
                    <td style="padding: 15px 10px; color: #555;">${grade.assessment_mark}</td>
                    <td style="padding: 15px 10px; color: #555;">${grade.exam_mark}</td>
                    <td style="padding: 15px 10px; font-weight: bold; color: #203791;">${total}</td>
                    <td style="padding: 15px 10px;">
                        <span style="background: ${total >= 50 ? '#E3FBE3' : '#FBE3E3'}; 
                                     color: ${total >= 50 ? '#2E7D32' : '#C62828'}; 
                                     padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">
                            ${total >= 50 ? 'Passed' : 'Failed'}
                        </span>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        const avg = grades.length > 0 ? (totalSum / grades.length).toFixed(1) : 0.0;
        const avgDisplay = document.getElementById("averageMark");
        if (avgDisplay) avgDisplay.innerText = avg;

    } catch (err) {
        console.error("Failed to load grades:", err);
    }
}