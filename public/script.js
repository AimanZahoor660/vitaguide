const isLocal =
  ["localhost", "127.0.0.1", ""].includes(location.hostname);
const API_URL = isLocal ? "http://localhost:5000/api/tips" : "/api/tips";

const form = document.getElementById("tipsForm");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");
const output = document.getElementById("output");
const summaryEl = document.getElementById("summary");
const statsEl = document.getElementById("stats");
const results = document.getElementById("results");
const mealPlanEl = document.getElementById("mealPlan");
const extrasEl = document.getElementById("extras");
const bmiBox = document.getElementById("bmiBox");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");

const sections = [
  { key: "diet", title: "🥗 Diet" },
  { key: "exercise", title: "🏃 Exercise" },
  { key: "sleep", title: "😴 Sleep" },
  { key: "hydration", title: "💧 Hydration" },
  { key: "stress", title: "🧘 Stress" },
];

let lastData = null;
let lastTips = null;

/* ---------- Helpers ---------- */

function val(id) {
  return document.getElementById(id).value;
}

function getFormData() {
  return {
    name: val("name").trim(),
    language: val("language"),
    age: val("age"),
    gender: val("gender"),
    height: val("height"),
    weight: val("weight"),
    work: val("work"),
    activity: val("activity"),
    goal: val("goal"),
    diet: val("diet"),
    sleep: val("sleep"),
    water: val("water"),
  };
}

function calcBMI(height, weight) {
  const m = height / 100;
  return weight / (m * m);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  return "Obese range";
}

function calcCalories(d) {
  let bmr = 10 * d.weight + 6.25 * d.height - 5 * d.age;
  bmr += d.gender === "male" ? 5 : -161;

  const factors = { low: 1.2, moderate: 1.55, high: 1.725 };
  let cal = bmr * (factors[d.activity] || 1.4);

  if (d.goal === "weight loss") cal -= 300;
  if (d.goal === "muscle gain") cal += 300;

  const minimum = d.gender === "male" ? 1500 : 1200;
  return Math.round(Math.max(cal, minimum) / 10) * 10;
}

/* ---------- Live BMI ---------- */

function updateBMI() {
  const h = Number(val("height"));
  const w = Number(val("weight"));
  if (!h || !w) {
    bmiBox.classList.add("hidden");
    return;
  }

  const bmi = calcBMI(h, w);
  const pos = Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100);

  bmiBox.innerHTML = "";
  const line = document.createElement("div");
  line.className = "bmi-line";
  line.textContent = "Your BMI: " + bmi.toFixed(1) + " (" + bmiCategory(bmi) + ")";

  const bar = document.createElement("div");
  bar.className = "bmi-bar";
  const dot = document.createElement("div");
  dot.className = "bmi-dot";
  dot.style.left = pos + "%";
  bar.appendChild(dot);

  const note = document.createElement("div");
  note.className = "bmi-note";
  note.textContent =
    "BMI is only a rough guide. Under 18? These categories are for adults.";

  bmiBox.append(line, bar, note);
  bmiBox.classList.remove("hidden");
}

document.getElementById("height").addEventListener("input", updateBMI);
document.getElementById("weight").addEventListener("input", updateBMI);

/* ---------- Dark mode ---------- */

const themeBtn = document.getElementById("themeBtn");

function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀️ Light" : "🌙 Dark";
}

try {
  applyTheme(localStorage.getItem("vg_dark") === "1");
} catch (e) {}

themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  applyTheme(dark);
  try {
    localStorage.setItem("vg_dark", dark ? "1" : "0");
  } catch (e) {}
});

/* ---------- Get tips ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();
  getTips(getFormData());
});

document.getElementById("regenBtn").addEventListener("click", () => {
  if (lastData) getTips(lastData);
});

async function getTips(data) {
  output.classList.add("hidden");
  message.className = "message";
  message.textContent = "Creating your tips, please wait...";
  submitBtn.disabled = true;
  document.getElementById("regenBtn").disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const tips = await res.json();
    if (!res.ok) throw new Error(tips.error || "Something went wrong.");

    lastData = data;
    lastTips = tips;
    showResults(tips, data);
    saveHistory(tips, data);
    message.textContent = "";
    output.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    message.className = "message error";
    message.textContent =
      "Sorry, could not get tips. " + err.message + " Please try again.";
  } finally {
    submitBtn.disabled = false;
    document.getElementById("regenBtn").disabled = false;
  }
}

/* ---------- Show results ---------- */

function makeStat(num, label) {
  const div = document.createElement("div");
  div.className = "stat";
  const n = document.createElement("div");
  n.className = "num";
  n.textContent = num;
  const l = document.createElement("div");
  l.className = "lbl";
  l.textContent = label;
  div.append(n, l);
  return div;
}

function showResults(tips, data) {
  const rtl = data.language === "Urdu";

  summaryEl.textContent = "";
  statsEl.textContent = "";
  results.textContent = "";
  mealPlanEl.textContent = "";
  extrasEl.textContent = "";

  [summaryEl, results, mealPlanEl, extrasEl].forEach((el) =>
    el.classList.toggle("rtl", rtl)
  );

  if (tips.summary) {
    summaryEl.textContent =
      (data.name ? data.name + ": " : "") + tips.summary;
  }

  const bmi = calcBMI(data.height, data.weight);
  statsEl.append(
    makeStat(bmi.toFixed(1), "BMI (" + bmiCategory(bmi) + ")"),
    makeStat("~" + calcCalories(data) + " kcal", "Estimated daily calories"),
    makeStat(data.sleep + " h / " + data.water + " glasses", "Sleep / Water now")
  );

  sections.forEach((s) => {
    const list = tips[s.key];
    if (!Array.isArray(list)) return;

    const card = document.createElement("div");
    card.className = "tip-card";
    const h = document.createElement("h3");
    h.textContent = s.title;
    const ul = document.createElement("ul");
    list.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    card.append(h, ul);
    results.appendChild(card);
  });

  if (tips.mealPlan) {
    const card = document.createElement("div");
    card.className = "tip-card meal-card";
    const h = document.createElement("h3");
    h.textContent = "🍽️ Sample 1-day meal plan";
    card.appendChild(h);

    const meals = [
      ["breakfast", "Breakfast"],
      ["lunch", "Lunch"],
      ["snack", "Snack"],
      ["dinner", "Dinner"],
    ];
    meals.forEach(([key, label]) => {
      if (!tips.mealPlan[key]) return;
      const row = document.createElement("div");
      row.className = "meal-row";
      const b = document.createElement("strong");
      b.textContent = label + ": ";
      row.append(b, document.createTextNode(tips.mealPlan[key]));
      card.appendChild(row);
    });
    mealPlanEl.appendChild(card);
  }

  if (tips.challenge) {
    const ch = document.createElement("div");
    ch.className = "challenge";
    const h = document.createElement("h3");
    h.textContent = "🎯 Today's challenge";
    const p = document.createElement("p");
    p.textContent = tips.challenge;
    ch.append(h, p);
    extrasEl.appendChild(ch);
  }

  if (tips.quote) {
    const q = document.createElement("p");
    q.className = "quote";
    q.textContent = "“" + tips.quote + "”";
    extrasEl.appendChild(q);
  }

  output.classList.remove("hidden");
}

/* ---------- Copy and Print ---------- */

document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!lastTips) return;

  let text = "VitaGuide - My wellness tips\n\n";
  if (lastTips.summary) text += lastTips.summary + "\n\n";

  sections.forEach((s) => {
    if (!Array.isArray(lastTips[s.key])) return;
    text += s.title + "\n";
    lastTips[s.key].forEach((t) => (text += "- " + t + "\n"));
    text += "\n";
  });

  if (lastTips.mealPlan) {
    const m = lastTips.mealPlan;
    text += "Meal plan\n";
    text += "Breakfast: " + (m.breakfast || "") + "\n";
    text += "Lunch: " + (m.lunch || "") + "\n";
    text += "Snack: " + (m.snack || "") + "\n";
    text += "Dinner: " + (m.dinner || "") + "\n\n";
  }

  if (lastTips.challenge) text += "Challenge: " + lastTips.challenge + "\n";
  text += "\nGeneral wellness info, not medical advice.";

  const btn = document.getElementById("copyBtn");
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "✅ Copied!";
  } catch (e) {
    btn.textContent = "Could not copy";
  }
  setTimeout(() => (btn.textContent = "📋 Copy"), 2000);
});

document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

/* ---------- History ---------- */

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("vg_history")) || [];
  } catch (e) {
    return [];
  }
}

function saveHistory(tips, data) {
  const list = loadHistory();
  list.unshift({ time: new Date().toLocaleString(), tips, data });
  try {
    localStorage.setItem("vg_history", JSON.stringify(list.slice(0, 10)));
  } catch (e) {}
  renderHistory();
}

function renderHistory() {
  const list = loadHistory();
  historyList.textContent = "";

  if (list.length === 0) {
    historySection.classList.add("hidden");
    return;
  }

  list.forEach((item) => {
    const li = document.createElement("li");
    li.textContent =
      (item.data.name || "Guest") + " - goal: " + item.data.goal;
    const small = document.createElement("small");
    small.textContent = item.time;
    li.appendChild(small);

    li.addEventListener("click", () => {
      lastData = item.data;
      lastTips = item.tips;
      showResults(item.tips, item.data);
      output.scrollIntoView({ behavior: "smooth" });
    });

    historyList.appendChild(li);
  });

  historySection.classList.remove("hidden");
}

document.getElementById("clearHistory").addEventListener("click", () => {
  try {
    localStorage.removeItem("vg_history");
  } catch (e) {}
  renderHistory();
});

renderHistory();