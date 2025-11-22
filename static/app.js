// ================================
// CONFIG
// ================================
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx6e7hUPssag_8DgQoo40A5M-OT4AuGP0TMcSx41BBXhQE-9j241AU72J6iZqnD4U43Bg/exec";

// ================================
// UI ELEMENTS
// ================================
const dashboardBtn = document.getElementById("dashboardBtn");
const addMealBtn = document.getElementById("addMealBtn");
const dashboardPage = document.getElementById("dashboardPage");
const addMealPage = document.getElementById("addMealPage");
const refreshBtn = document.getElementById("refreshBtn");
const mealList = document.getElementById("mealList");

const totalBreakfast = document.getElementById("totalBreakfast");
const totalNight = document.getElementById("totalNight");
const totalResidents = document.getElementById("totalResidents");

const form = document.getElementById("mealForm");
const nameInput = document.getElementById("name");
const breakfastInput = document.getElementById("breakfast");
const nightInput = document.getElementById("nightMeal");
const statusMsg = document.getElementById("statusMessage");

// ================================
// PAGE SWITCH
// ================================
dashboardBtn.onclick = () => switchPage("dashboard");
addMealBtn.onclick = () => switchPage("add");

function switchPage(page) {
  if (page === "dashboard") {
    dashboardPage.classList.add("active");
    addMealPage.classList.remove("active");
    dashboardBtn.classList.add("active");
    addMealBtn.classList.remove("active");
  } else {
    addMealPage.classList.add("active");
    dashboardPage.classList.remove("active");
    addMealBtn.classList.add("active");
    dashboardBtn.classList.remove("active");
  }
}

// ================================
// LOAD TODAY'S DATA
// ================================
async function loadData() {
  mealList.innerHTML = `<div class="loading">Loading...</div>`;

  try {
    const res = await fetch(`${SCRIPT_URL}?action=getTodayData`, {
      cache: "no-cache",
    });
    const json = await res.json();

    if (json.success) {
      const data = json.data || [];

      // Update table
      renderTable(data);

      // Update stats
      updateStats(data);
    } else {
      mealList.innerHTML = `<div class="loading">Failed to load</div>`;
    }
  } catch (err) {
    mealList.innerHTML = `<div class="loading">Error loading data</div>`;
  }
}

refreshBtn.onclick = loadData;

// ================================
// UPDATE DASHBOARD STATS
// ================================
function updateStats(data) {
  const bf = data.filter((d) => d.breakfast == "1").length;
  const nt = data.filter((d) => d.nightMeal == "1").length;
  const people = data.length;

  totalBreakfast.textContent = bf;
  totalNight.textContent = nt;
  totalResidents.textContent = people;
}

// ================================
// RENDER TABLE (ULTRA SLIM)
// ================================
function renderTable(data) {
  if (!data.length) {
    mealList.innerHTML = `<div class="loading">No data</div>`;
    return;
  }

  let html = "";
  data.forEach((item) => {
    html += `
      <div class="table-row">
        <div>${item.name}</div>
        <div>${item.breakfast === "1" ? "✔" : "-"}</div>
        <div>${item.nightMeal === "1" ? "✔" : "-"}</div>

        <div class="row-actions">
          <button class="edit-btn" onclick='editEntry("${item.name}")'>✏️</button>
        </div>
      </div>
    `;
  });

  mealList.innerHTML = html;
}

// ================================
// EDIT ENTRY
// ================================
async function editEntry(name) {
  const res = await fetch(`${SCRIPT_URL}?action=getTodayData`);
  const json = await res.json();

  const entry = json.data.find((e) => e.name === name);
  if (!entry) return;

  nameInput.value = entry.name;
  breakfastInput.checked = entry.breakfast === "1";
  nightInput.checked = entry.nightMeal === "1";

  switchPage("add");
}

// ================================
// DELETE ENTRY
// ================================
async function deleteEntry(name) {
  if (!confirm("Delete this entry?")) return;

  const url =
    SCRIPT_URL + "?action=deletePreference&name=" + encodeURIComponent(name);

  const res = await fetch(url);
  const json = await res.json();

  if (json.success) {
    loadData();
  } else {
    alert("Delete failed");
  }
}

// ================================
// SAVE ENTRY
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData();
  fd.append("action", "savePreference");
  fd.append("name", nameInput.value.trim());
  fd.append("breakfast", breakfastInput.checked ? "1" : "0");
  fd.append("nightMeal", nightInput.checked ? "1" : "0");

  const res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
  const json = await res.json();

  statusMsg.textContent = json.data || "Successfully Saved!";
  setTimeout(() => (statusMsg.textContent = ""), 1500);

  loadData();
  switchPage("dashboard");
});

// ================================
// INITIAL LOAD
// ================================
loadData();
