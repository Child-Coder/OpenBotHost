// গুরুত্বপূর্ণ: Render এ আপনার ব্যাকএন্ড ডেপ্লয় করার পর যে URL পাবেন,
// সেটি এখানে পেস্ট করতে হবে।
const API_URL = 'https://openbothost-api.onrender.com'; // আপনার URL দিয়ে পরিবর্তন করুন

// DOM Elements
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const dashboardView = document.getElementById('dashboard-view');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const addBotForm = document.getElementById('add-bot-form');

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const logoutButton = document.getElementById('logout-button');
const botsList = document.getElementById('bots-list');
const welcomeMessage = document.getElementById('welcome-message');

// --- View Switching Logic ---
function showView(viewId) {
    loginView.classList.add('hidden');
    registerView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

showRegisterLink.addEventListener('click', () => showView('register-view'));
showLoginLink.addEventListener('click', () => showView('login-view'));

// --- API Functions ---
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            showView('login-view');
        }
    } catch (error) {
        alert('Registration failed. Please try again.');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            alert('Login successful!');
            showDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    alert('Logged out.');
    showView('login-view');
}

async function fetchBots() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/bots`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        botsList.innerHTML = ''; // Clear previous list
        if (data.bots && data.bots.length > 0) {
            data.bots.forEach(bot => {
                const li = document.createElement('li');
                // নিরাপত্তার জন্য টোকেনের কিছু অংশ দেখানো হচ্ছে
                li.textContent = `...${bot.slice(-10)}`;
                botsList.appendChild(li);
            });
        } else {
            botsList.innerHTML = '<li>No bots added yet.</li>';
        }
    } catch (error) {
        console.error('Failed to fetch bots:', error);
    }
}

async function handleAddBot(event) {
    event.preventDefault();
    const botToken = document.getElementById('bot-token-input').value;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/bots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bot_token: botToken })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            document.getElementById('bot-token-input').value = '';
            fetchBots(); // Refresh the bot list
        }
    } catch (error) {
        alert('Failed to add bot. Please try again.');
    }
}

function showDashboard() {
    welcomeMessage.textContent = `Welcome! You are logged in.`;
    showView('dashboard-view');
    fetchBots();
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    addBotForm.addEventListener('submit', handleAddBot);
    logoutButton.addEventListener('click', handleLogout);

    const token = localStorage.getItem('token');
    if (token) {
        // এখানে আমরা টোকেন ভ্যালিড কিনা চেক করতে পারতাম,
        // কিন্তু সরলতার জন্য সরাসরি ড্যাশবোর্ড দেখাচ্ছি।
        showDashboard();
    } else {
        showView('login-view');
    }
});
