// Configuration - Replace with your Google Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6kuGaALB1zEG7WVtL7OtNiFulQ0pbelI8aNdW68z0PNhPk-UL-qr4zfN8ywTprb-s6Q/exec';

// DOM elements
const dashboardBtn = document.getElementById('dashboardBtn');
const addMealBtn = document.getElementById('addMealBtn');
const dashboardPage = document.getElementById('dashboardPage');
const addMealPage = document.getElementById('addMealPage');
const mealList = document.getElementById('mealList');
const totalBreakfast = document.getElementById('totalBreakfast');
const totalNight = document.getElementById('totalNight');
const totalResidents = document.getElementById('totalResidents');
const refreshBtn = document.getElementById('refreshBtn');
const generateIdBtn = document.getElementById('generateIdBtn');
const mealForm = document.getElementById('mealForm');
const lastUpdated = document.getElementById('lastUpdated');

// Initialize application
function initApp() {
    setupEventListeners();
    loadDataFromSheets();
    updateLastUpdated();
}

// Event listeners
function setupEventListeners() {
    // Navigation
    dashboardBtn.addEventListener('click', showDashboard);
    addMealBtn.addEventListener('click', showAddMeal);

    // Refresh
    refreshBtn.addEventListener('click', loadDataFromSheets);

    // Generate ID
    generateIdBtn.addEventListener('click', generateMealId);

    // Form submission
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        savePreferences();
    });

    // Toggle switches
    document.getElementById('breakfast').addEventListener('change', function() {
        document.getElementById('breakfast-status').textContent = this.checked ? 'On' : 'Off';
    });

    document.getElementById('nightMeal').addEventListener('change', function() {
        document.getElementById('nightMeal-status').textContent = this.checked ? 'On' : 'Off';
    });
}

// Navigation
function showDashboard() {
    dashboardPage.classList.add('active');
    addMealPage.classList.remove('active');
    dashboardBtn.classList.add('active');
    addMealBtn.classList.remove('active');
    loadDataFromSheets();
}

function showAddMeal() {
    addMealPage.classList.add('active');
    dashboardPage.classList.remove('active');
    addMealBtn.classList.add('active');
    dashboardBtn.classList.remove('active');
    generateMealId();
}

// Generate Meal ID
function generateMealId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    document.getElementById('mealId').value = `M${timestamp}${random}`;
}

// Load data from Google Sheets
async function loadDataFromSheets() {
    try {
        showLoading();

        const response = await fetch(`${SCRIPT_URL}?action=getTodayData&t=${Date.now()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            updateDashboard(data.data);
            updateLastUpdated();
            showMessage('✅ Data loaded successfully', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('❌ Error loading data: ' + error.message, 'error');
        loadSampleData();
    }
}

// Update dashboard with data
function updateDashboard(mealData) {
    const breakfastCount = mealData.reduce((sum, person) => sum + (person.breakfast === '1' ? 1 : 0), 0);
    const nightCount = mealData.reduce((sum, person) => sum + (person.nightMeal === '1' ? 1 : 0), 0);

    totalBreakfast.textContent = breakfastCount;
    totalNight.textContent = nightCount;
    totalResidents.textContent = mealData.length;

    renderMealList(mealData);
}

// Render meal list
function renderMealList(mealData) {
    if (mealData.length === 0) {
        mealList.innerHTML = '<div class="loading">No meal selections for today yet</div>';
        return;
    }

    mealList.innerHTML = '';

    mealData.forEach(person => {
        const personRow = document.createElement('div');
        personRow.className = 'person-row';

        personRow.innerHTML = `
            <div class="person-name">${escapeHtml(person.name)}</div>
            <div class="person-id">${escapeHtml(person.mealId || 'N/A')}</div>
            <div class="meal-status ${person.breakfast === '1' ? 'on' : 'off'}">
                ${person.breakfast === '1' ? '✓' : '✗'}
            </div>
            <div class="meal-status ${person.nightMeal === '1' ? 'on' : 'off'}">
                ${person.nightMeal === '1' ? '✓' : '✗'}
            </div>
        `;

        mealList.appendChild(personRow);
    });
}

// Save preferences
async function savePreferences() {
    const name = document.getElementById('name').value.trim();
    const mealId = document.getElementById('mealId').value.trim();
    const breakfast = document.getElementById('breakfast').checked ? '1' : '0';
    const nightMeal = document.getElementById('nightMeal').checked ? '1' : '0';

    if (!name || !mealId) {
        showMessage('Please enter your name and Meal ID', 'error');
        return;
    }

    try {
        showMessage('Saving to Google Sheets...', 'success');

        const payload = {
            action: 'savePreference',
            name: name,
            mealId: mealId,
            breakfast: breakfast,
            nightMeal: nightMeal
        };

        console.log('Sending data:', payload);

        // Create the JSON string first to calculate content length
        const jsonPayload = JSON.stringify(payload);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': new TextEncoder().encode(jsonPayload).length.toString()
            },
            body: jsonPayload
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        if (result.success) {
            showMessage('✅ Preferences saved successfully!', 'success');
            clearForm();
            setTimeout(() => {
                showDashboard();
                loadDataFromSheets(); // Refresh the data
            }, 2000);
        } else {
            throw new Error(result.data || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showMessage('❌ Error saving: ' + error.message, 'error');
    }
}

// Utility functions
function showLoading() {
    mealList.innerHTML = '<div class="loading">Loading data from Google Sheets...</div>';
    totalBreakfast.textContent = '0';
    totalNight.textContent = '0';
    totalResidents.textContent = '0';
}

function showMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = type === 'success' ? 'status-success' : 'status-error';

    if (type === 'success') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 5000);
    }
}

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('mealId').value = '';
    document.getElementById('breakfast').checked = false;
    document.getElementById('nightMeal').checked = false;
    document.getElementById('breakfast-status').textContent = 'Off';
    document.getElementById('nightMeal-status').textContent = 'Off';
    generateMealId();
}

function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Fallback sample data
function loadSampleData() {
    const sampleData = [
        { name: "John Doe", mealId: "M123456", breakfast: '1', nightMeal: '0' },
        { name: "Jane Smith", mealId: "M789012", breakfast: '0', nightMeal: '1' },
        { name: "Bob Johnson", mealId: "M345678", breakfast: '1', nightMeal: '1' }
    ];
    updateDashboard(sampleData);
    showMessage('Using sample data - Check Google Sheets connection', 'error');
}
// Test connection function
async function testConnection() {
    try {
        showMessage('Testing connection...', 'success');
        
        const response = await fetch(`${SCRIPT_URL}?action=testConnection&t=${Date.now()}`);
        const result = await response.json();
        
        console.log('Connection test result:', result);
        
        if (result.success) {
            showMessage('✅ Connection to Google Sheets successful!', 'success');
        } else {
            showMessage('❌ Connection failed: ' + result.data, 'error');
        }
    } catch (error) {
        console.error('Connection test error:', error);
        showMessage('❌ Connection test failed: ' + error.message, 'error');
    }
}

// Enhanced save function with detailed logging
async function savePreferences() {
    const name = document.getElementById('name').value.trim();
    const mealId = document.getElementById('mealId').value.trim();
    const breakfast = document.getElementById('breakfast').checked ? '1' : '0';
    const nightMeal = document.getElementById('nightMeal').checked ? '1' : '0';

    if (!name || !mealId) {
        showMessage('Please enter your name and Meal ID', 'error');
        return;
    }

    try {
        showMessage('Saving to Google Sheets...', 'success');

        const payload = {
            action: 'savePreference',
            name: name,
            mealId: mealId,
            breakfast: breakfast,
            nightMeal: nightMeal
        };

        console.log('Sending payload:', payload);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Server response:', result);

        if (result.success) {
            showMessage('✅ Preferences saved successfully!', 'success');
            clearForm();
            setTimeout(() => {
                showDashboard();
                loadDataFromSheets();
            }, 2000);
        } else {
            throw new Error(result.data || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showMessage('❌ Save failed: ' + error.message, 'error');
    }
}

// Auto-refresh every 30 seconds
setInterval(loadDataFromSheets, 30000);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);