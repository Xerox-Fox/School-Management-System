const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const btn = document.querySelector('.btn-primary');
    btn.innerText = "Logging in...";
    btn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/login', { // Adjust URL to your route
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Store the token and user info in LocalStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('fullname', data.user.fullname);
            localStorage.setItem('display_id', data.user.display_id);
            localStorage.setItem('user_type', data.user.user_type);
            localStorage.setItem("isAuthenticated", "true");

            const displayId = data.user.display_id || '';
            const userType = data.user.user_type || '';

             if (userType === 'root'){
                window.location.href = '../root/rdash.html';
             } else if (displayId.startsWith('STU-')) {
                window.location.href = '../student/sdash.html';
             } else if (displayId.startsWith('TEA-')) {
                window.location.href = '../teacher/tdash.html';
             } else if (displayId.startsWith('PRT-')) {
                window.location.href = '../parent/pdash.html';
             } else {
                window.location.href = '../Home/home.html'
             }
        } else {
            alert(data.msg || 'Login failed - invalid credentials');
            btn.innerHTML = "Login";
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Server connection failed. Is your Node server running?");
        btn.innerHTML = "Login";
        btn.disabled = false;
    }
});