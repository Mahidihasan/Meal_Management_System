const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-hJQ8W9c-jVIjans7clGqVT_4LiDDIb0DeG4saVmQ4GLvUNyF6NNY5Ifx42--WzXcDg/exec';

// ------------------- Utility Functions -------------------
function qs(selector) { return document.querySelector(selector); }
function qsa(selector) { return document.querySelectorAll(selector); }

// ------------------- Toggle Views -------------------
const dashboardBtn = qs('#dashboardBtn');
const addMealBtn = qs('#addMealBtn');
const dashboardPage = qs('#dashboardPage');
const addMealPage = qs('#addMealPage');

dashboardBtn.addEventListener('click', () => {
    dashboardBtn.classList.add('active');
    addMealBtn.classList.remove('active');
    dashboardPage.classList.add('active');
    addMealPage.classList.remove('active');
});

addMealBtn.addEventListener('click', () => {
    addMealBtn.classList.add('active');
    dashboardBtn.classList.remove('active');
    addMealPage.classList.add('active');
    dashboardPage.classList.remove('active');
});

// ------------------- Meal Form -------------------
const mealForm = qs('#mealForm');
const statusMessage = qs('#statusMessage');

mealForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
        name: qs('#name').value,
        mealId: new Date().getTime().toString(), // temporary unique ID
        breakfast: qs('#breakfast').checked ? '1' : '0',
        nightMeal: qs('#nightMeal').checked ? '1' : '0'
    };
    savePreference(data);
});

// ------------------- Update toggle status -------------------
qs('#breakfast').addEventListener('change', e => {
    qs('#breakfast-status').innerText = e.target.checked ? 'On' : 'Off';
});
qs('#nightMeal').addEventListener('change', e => {
    qs('#nightMeal-status').innerText = e.target.checked ? 'On' : 'Off';
});

// ------------------- Save Preference to Google Sheets -------------------
function savePreference(data) {
    const params = new URLSearchParams({
        action: 'savePreference',
        name: data.name,
        mealId: data.mealId,
        breakfast: data.breakfast,
        nightMeal: data.nightMeal
    });

    fetch(`${SCRIPT_URL}?${params.toString()}`)
        .then(res => res.json())
        .then(resp => {
            console.log(resp);
            statusMessage.innerText = resp.data;
            getTodayData(); // refresh dashboard
        })
        .catch(err => {
            console.error(err);
            statusMessage.innerText = 'Error saving data';
        });
}

// ------------------- Get Today's Data -------------------
function getTodayData() {
    fetch(`${SCRIPT_URL}?action=getTodayData`)
        .then(res => res.json())
        .then(resp => {
            if (resp.success) {
                const list = qs('#mealList');
                list.innerHTML = '';
                let breakfastCount = 0, nightCount = 0, residents = 0;

                resp.data.forEach(person => {
                    residents++;
                    if (person.breakfast === '1') breakfastCount++;
                    if (person.nightMeal === '1') nightCount++;

                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    row.innerHTML = `
                        <div>${person.name}</div>
                        <div class="badge ${person.breakfast === '1' ? 'on' : 'off'}">
                            ${person.breakfast === '1' ? 'Breakfast ✅' : '❌'}
                        </div>
                        <div class="badge ${person.nightMeal === '1' ? 'on' : 'off'}">
                            ${person.nightMeal === '1' ? 'Night Meal ✅' : '❌'}
                        </div>
                    `;
                    list.appendChild(row);
                });

                qs('#totalBreakfast').innerText = breakfastCount;
                qs('#totalNight').innerText = nightCount;
                qs('#totalResidents').innerText = residents;
            }
        })
        .catch(err => console.error(err));
}

const row = document.createElement('div');
row.classList.add('table-row'); // This already matches new CSS
row.innerHTML = `
    <div>${person.name}</div>
    <div>${person.breakfast === '1' ? '✅' : '❌'}</div>
    <div>${person.nightMeal === '1' ? '✅' : '❌'}</div>
`;
list.appendChild(row);

// ------------------- Refresh Button -------------------
qs('#refreshBtn').addEventListener('click', getTodayData);

// Initial load
getTodayData();
