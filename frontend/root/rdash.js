const body = document.querySelector("body"),
    sidebar = body.querySelector(".sidebar"),
    toggle = body.querySelector(".toggle"),
    blogForm = document.getElementById("blogForm"),
    userForm = document.getElementById("form"),
    userTypeSelect = document.getElementById("user_type"),
    subjectContainer = document.getElementById("subject_container"),
    subjectSelect = document.getElementById("subject"),
    navLinks = body.querySelectorAll(".menu-links .nav-link a");

// 1. Sidebar Toggle
if (toggle) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("close"));
}

const isAuth = localStorage.getItem("isAuthenticated");

if (!isAuth) {
  window.location.href = "/login.html";
}

// 2. Image Preview Logic
const imageInput = document.getElementById("blogImage");
const previewContainer = document.getElementById('imagePreviewContainer');
const clearBtn = document.getElementById("clearImages");

if (imageInput) {
    imageInput.addEventListener('change', function() {
        previewContainer.innerHTML = '';
        const files = Array.from(this.files);
        clearBtn.style.display = files.length > 0 ? "flex" : "none";

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `<img src="${e.target.result}" alt="preview">`;
                    previewContainer.appendChild(div);
                }
                reader.readAsDataURL(file);
            }
        });
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        imageInput.value = ""; 
        previewContainer.innerHTML = ""; 
        clearBtn.style.display = "none"; 
    });
}

// 3. Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "../Login/login.html"; 
    });
}

// 4. CHART LOGIC
let chartInstances = { dash: null, anal: null };

async function refreshAllCharts() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("https://lms-backend-zghq.onrender.com/api/users/all", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const users = await response.json();

        if (response.ok && Array.isArray(users)) {
            const stats = {
                student: users.filter(u => u.user_type === 'student').length,
                teacher: users.filter(u => u.user_type === 'teacher').length,
                parent: users.filter(u => u.user_type === 'parent').length
            };

            document.getElementById("dashStudentCount").innerText = stats.student;
            document.getElementById("dashTeacherCount").innerText = stats.teacher;

            const counterEl = document.getElementById("totalUserCount");
            if (counterEl) counterEl.innerText = users.length;
            

            
            renderSingleChart('dashChart', stats, 'dash');
            renderSingleChart('analChart', stats, 'anal');
        }
    } catch (err) {
        console.error("Chart Refresh Error:", err);
    }
}

function renderSingleChart(canvasId, stats, key) {
    const el = document.getElementById(canvasId);
    if (!el) return; // Skip if the element isn't in the HTML

    const ctx = el.getContext('2d');
    if (chartInstances[key]) chartInstances[key].destroy();

    chartInstances[key] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Students', 'Teachers', 'Parents'],
            datasets: [{
                data: [stats.student, stats.teacher, stats.parent],
                backgroundColor: ['#203791', '#4C6EF5', '#BAC8FF'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '75%'
        }
    });
}


document.addEventListener("DOMContentLoaded", refreshAllCharts);


if (blogForm) {
    blogForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        // Use FormData to handle both text and image files
        const formData = new FormData();
        formData.append("title", document.getElementById("blogTitle").value);
        formData.append("content", document.getElementById("blogContent").value);
        
        // Append all selected images from the input
        const selectedFiles = imageInput.files;
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("images", selectedFiles[i]);
        }

        try {
            const response = await fetch("https://lms-backend-zghq.onrender.com/api/blog/post", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}` 
                    // Note: Do NOT set 'Content-Type' header manually when sending FormData
                },
                body: formData
            });

            if (response.ok) {
                alert("News posted successfully!");
                
                // Reset the form and the UI previews
                blogForm.reset();
                if (previewContainer) previewContainer.innerHTML = '';
                if (clearBtn) clearBtn.style.display = "none";
            } else {
                const errorData = await response.json();
                alert("Failed to post: " + (errorData.msg || "Server Error"));
            }
        } catch (error) { 
            console.error("Post Error:", error);
            alert("An error occurred while posting the news.");
        }
    });
}



if (userTypeSelect) {
    userTypeSelect.addEventListener("change", function() {
        if (this.value === "teacher") {
            subjectContainer.style.display = "block";
            subjectSelect.setAttribute("required", "true"); 
        } else {
            subjectContainer.style.display = "none";
            subjectSelect.removeAttribute("required");
            subjectSelect.value = ""; 
        }
    });
}

if (userForm) {
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        const userData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("addr").value,
            user_type: document.getElementById("user_type").value,
            subject: document.getElementById("user_type").value === "teacher" ? document.getElementById("subject").value : null,
            password: "temporary_placeholder",
        };

        try {
            const response = await fetch("https://lms-backend-zghq.onrender.com/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (response.ok) {
                alert(`USER REGISTERED SUCCESSFULLY!\n\n` +
                      `Display ID: ${data.display_id}\n` +
                      `Temporary Password: ${data.Password}\n\n` +
                      `Please provide these credentials to the user.`);
                userForm.reset();
                refreshAllCharts(); // Use the correct function name here
            } else {
                alert("Error: " + data.msg);
            }
        } catch (error) { console.error(error); }
    });
}

// 7. Navigation Logic
navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith('#') || href === "#") return;

        e.preventDefault();
        const targetId = href.substring(1);

        document.querySelectorAll('.menu-links .nav-link').forEach(li => {
            li.classList.remove('active'); 
        });
        
        document.querySelectorAll('.main-content > div, .main-content > section').forEach(page => {
            page.classList.remove('active', 'fade-in');
            page.style.display = "none";
        });

        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.classList.add('active', 'fade-in');
            link.parentElement.classList.add('active');

            
            if (targetId === 'post') {
                targetSection.style.display = "flex"; 
                
                const isRoot = (localStorage.getItem('user_type') === 'root');
                
                
                const rootArea = document.getElementById('rootPostArea');
                const msgArea = document.getElementById('nonRootMessage');
                
                if (rootArea) rootArea.style.display = isRoot ? 'block' : 'none';
                if (msgArea) msgArea.style.display = isRoot ? 'none' : 'block';
            } else {
                targetSection.style.display = "block";
                
                
                if (targetId === 'home' || targetId === 'analytics') {
                    refreshAllCharts();
                }
            }
        }
    });
});