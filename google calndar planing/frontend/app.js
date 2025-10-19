// Production Planner Frontend JavaScript

const API_URL = 'http://localhost:8000';

// State
let employees = [];
let tasks = [];
let currentWeather = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    await loadEmployees();
    await loadTasks();
    await loadWeather();
    await loadStats();
}

function setupEventListeners() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Task form
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Employee form
    const employeeForm = document.getElementById('employee-form');
    employeeForm.addEventListener('submit', handleEmployeeSubmit);
    
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTasks(btn.dataset.tab);
        });
    });
}

// ==================== API Functions ====================

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('Chyba pri komunikácii so serverom', 'error');
        return null;
    }
}

// ==================== Load Data Functions ====================

async function loadEmployees() {
    const data = await apiCall('/employees');
    if (data) {
        employees = data;
        renderEmployees();
        updateEmployeeSelect();
    }
}

async function loadTasks(filter = 'upcoming') {
    let endpoint = '/tasks';
    
    if (filter === 'upcoming') {
        const today = new Date().toISOString();
        const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        endpoint += `?start_date=${today}&end_date=${weekLater}`;
    }
    
    const data = await apiCall(endpoint);
    if (data) {
        tasks = data;
        renderTasks();
    }
}

async function loadWeather() {
    const current = await apiCall('/weather');
    const forecast = await apiCall('/weather/forecast?days=5');
    
    if (current) {
        currentWeather = current;
        renderWeather(current, forecast?.forecast || []);
    }
}

async function loadStats() {
    const data = await apiCall('/stats/overview');
    if (data) {
        renderStats(data);
    }
}

// ==================== Render Functions ====================

function renderEmployees() {
    const container = document.getElementById('employees-list');
    
    if (employees.length === 0) {
        container.innerHTML = '<p class="loading">Žiadni zamestnanci</p>';
        return;
    }
    
    container.innerHTML = employees.map(emp => `
        <div class="employee-item">
            <div>
                <div class="employee-name">${emp.name}</div>
                <div class="task-meta">${emp.email}</div>
            </div>
            <span class="employee-type">${getEmployeeTypeLabel(emp.employee_type)}</span>
        </div>
    `).join('');
}

function renderTasks() {
    const container = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="loading">Žiadne úlohy</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.task_type}" onclick="showTaskDetails(${task.id})">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                ${formatDateTime(task.start_time)} • ${task.employee?.name || 'Nepriradené'}
            </div>
        </div>
    `).join('');
}

function renderWeather(current, forecast) {
    const currentContainer = document.getElementById('current-weather');
    const forecastContainer = document.getElementById('weather-forecast');
    
    // Current weather
    const icon = getWeatherIcon(current.condition);
    const recommendation = current.suitable_for_installation ? '✅ Vhodné na inštaláciu' : '🏭 Vhodné na výrobu';
    
    currentContainer.innerHTML = `
        <div class="weather-icon">${icon}</div>
        <div class="temperature">${Math.round(current.temperature)}°C</div>
        <div class="weather-description">${current.description}</div>
        <div style="margin-top: 10px; text-align: center; font-size: 0.9rem;">
            ${recommendation}
        </div>
    `;
    
    // Forecast
    forecastContainer.innerHTML = forecast.slice(0, 5).map(day => `
        <div class="forecast-item">
            <div>
                <strong>${formatDate(day.date)}</strong><br>
                <small>${day.description}</small>
            </div>
            <div style="text-align: right;">
                ${getWeatherIcon(day.condition)} ${Math.round(day.temperature)}°C
            </div>
        </div>
    `).join('');
}

function renderStats(stats) {
    const container = document.getElementById('stats');
    
    container.innerHTML = `
        <div class="stat-item">
            <span>Zamestnanci</span>
            <span class="stat-value">${stats.total_employees}</span>
        </div>
        <div class="stat-item">
            <span>Všetky úlohy</span>
            <span class="stat-value">${stats.total_tasks}</span>
        </div>
        <div class="stat-item">
            <span>Nasledujúci týždeň</span>
            <span class="stat-value">${stats.upcoming_tasks}</span>
        </div>
    `;
}

// ==================== Chat Functions ====================

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Send to API
    const response = await apiCall('/chat', 'POST', { message });
    
    if (response) {
        addMessageToChat(response.response, 'bot');
        
        // If action was taken, refresh data
        if (response.action_taken) {
            setTimeout(() => {
                refreshAll();
            }, 1000);
        }
    }
}

function addMessageToChat(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ==================== Modal Functions ====================

function showNewTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('show');
    
    // Set default start time to tomorrow 8:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    document.getElementById('task-start').value = formatDateTimeLocal(tomorrow);
}

function showNewEmployeeModal() {
    const modal = document.getElementById('employee-modal');
    modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// ==================== Form Handlers ====================

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('task-title').value,
        task_type: document.getElementById('task-type').value,
        start_time: document.getElementById('task-start').value,
        estimated_hours: parseFloat(document.getElementById('task-hours').value),
        description: document.getElementById('task-description').value,
        employee_id: document.getElementById('task-employee').value || null,
    };
    
    const result = await apiCall('/tasks', 'POST', taskData);
    
    if (result) {
        showNotification('Úloha bola vytvorená', 'success');
        closeModal('task-modal');
        e.target.reset();
        await loadTasks();
    }
}

async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeData = {
        name: document.getElementById('employee-name').value,
        email: document.getElementById('employee-email').value,
        employee_type: document.getElementById('employee-type').value,
        max_hours_per_week: parseFloat(document.getElementById('employee-hours').value),
    };
    
    const result = await apiCall('/employees', 'POST', employeeData);
    
    if (result) {
        showNotification('Zamestnanec bol vytvorený', 'success');
        closeModal('employee-modal');
        e.target.reset();
        await loadEmployees();
    }
}

// ==================== Helper Functions ====================

function updateEmployeeSelect() {
    const select = document.getElementById('task-employee');
    select.innerHTML = '<option value="">Automaticky priradiť</option>' +
        employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
}

function getEmployeeTypeLabel(type) {
    const labels = {
        'installer': 'Inštalátor',
        'producer': 'Výrobca',
        'both': 'Oboje'
    };
    return labels[type] || type;
}

function getWeatherIcon(condition) {
    const icons = {
        'clear': '☀️',
        'clouds': '☁️',
        'rain': '🌧️',
        'drizzle': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'fog': '🌫️'
    };
    return icons[condition.toLowerCase()] || '🌤️';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];
    return `${days[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}. ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced with a library)
    alert(message);
}

function showTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const details = `
Úloha: ${task.title}
Typ: ${task.task_type}
Začiatok: ${formatDateTime(task.start_time)}
Trvanie: ${task.estimated_hours}h
Zamestnanec: ${task.employee?.name || 'Nepriradené'}
Stav: ${task.status}
${task.description ? '\nPopis: ' + task.description : ''}
        `;
        alert(details);
    }
}

async function refreshAll() {
    await loadEmployees();
    await loadTasks();
    await loadWeather();
    await loadStats();
    showNotification('Dáta boli obnovené', 'success');
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}


