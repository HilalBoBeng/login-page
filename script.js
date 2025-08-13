document.addEventListener('DOMContentLoaded', () => {
    // Auth elements
    const authContainer = document.getElementById('auth-container');
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // Chat elements
    const chatContainer = document.getElementById('chat-container');
    const logoutBtn = document.getElementById('logout-btn');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');

    const API_BASE_URL = 'http://localhost:3000';

    // --- Auth View Toggle ---
    showSignup.addEventListener('click', () => {
        loginBox.classList.add('hidden');
        signupBox.classList.remove('hidden');
    });

    showLogin.addEventListener('click', () => {
        signupBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });


    // --- Auth Logic ---

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        signupError.textContent = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `HTTP error! status: ${res.status}`);
            }

            // Success, switch to login form with a success message
            signupBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
            loginError.textContent = 'Signup successful! Please login.';
            setTimeout(() => loginError.textContent = '', 4000);
            signupForm.reset();

        } catch (error) {
            signupError.textContent = error.message;
            setTimeout(() => signupError.textContent = '', 3000);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `HTTP error! status: ${res.status}`);
            }

            // Store UID or token if needed, for now just switch view
            // sessionStorage.setItem('user_uid', data.uid);

            authContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            addMessage('ai', 'Hello! How can I help you today?');
            loginForm.reset();

        } catch (error) {
            loginError.textContent = error.message;
            setTimeout(() => loginError.textContent = '', 3000);
        }
    });

    logoutBtn.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        // Clear session storage if used
        // sessionStorage.removeItem('user_uid');
        chatMessages.innerHTML = ''; // Clear chat history
    });


    // --- Chat Logic ---

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        addMessage('user', messageText);
        messageInput.value = '';

        getAIResponse(messageText);
    }

    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        const textElement = document.createElement('div');
        textElement.classList.add('text');
        textElement.textContent = text;

        messageElement.appendChild(textElement);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function getAIResponse(userInput) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response from server.');
            }

            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            addMessage('ai', aiText);

        } catch (error) {
            console.error("Chat Error:", error);
            addMessage('ai', `Sorry, something went wrong: ${error.message}`);
        }
    }
});
