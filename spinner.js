// Auth Check
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken'); // Replace with sessionStorage if applicable
  if (token) {
    window.location.href = 'dashboard.html';
  }
});

document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const identity = document.getElementById('identity').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!identity || !password) {
    showMessage("Please fill in all fields.", "error", "login-message");
    return;
  }

  toggleLoadingScreen(true);

  try {
    const response = await fetch('https://tracking-system-backend.vercel.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ office_id: identity, password: password })
    });

    const data = await response.json();

    if (response.ok) {
      const { token } = data;
      if (token) {
        const currentTime = Date.now();
        const expiryTime = currentTime + 3600000;

        localStorage.setItem('authToken', token);
        localStorage.setItem('tokenExpiry', expiryTime);
        console.log("Token and expiry time stored successfully.");

        showMessage("Login successful!", "success", "login-message");
        window.location.href = 'dashboard.html';
      } else {
        console.error("No token in response. Cannot save to localStorage.");
      }
    } else {
      showMessage(data.message || "Login failed. Please try again.", "error", "login-message");
    }
  } catch (error) {
    showMessage("An error occurred. Please check your network connection.", "error", "login-message");
    console.error(error);
  } finally {
    toggleLoadingScreen(false);
  }
});

function toggleLoadingScreen(show) {
  document.getElementById('loading-screen').style.display = show ? 'flex' : 'none';
}

function showMessage(message, type, targetId) {
  const messageDiv = document.getElementById(targetId);
  messageDiv.textContent = message;
  messageDiv.style.color = type === "success" ? "green" : "red";
  messageDiv.style.display = "block";
}
