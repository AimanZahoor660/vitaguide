require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];
const MAX_TRIES = 3;

const FOODS = [
  "masoor daal", "moong daal", "chana chaat", "dalia", "khichri",
  "anday ka omelette", "palak", "bhindi", "lauki", "tori", "saag",
  "lassi", "chaach", "dahi", "fruit chaat", "besan chilla",
  "makai roti", "jau ki roti", "mixed sabzi", "grilled chicken tikka",
  "machli (fish)", "amrood", "kela", "santra", "anar", "kheera salad",
  "roasted chana", "sattu drink", "rajma", "lobia",
];

const FOCUS = [
  "easy habits that take under 5 minutes",
  "busy schedule and limited time",
  "budget-friendly choices",
  "morning routine",
  "evening routine",
  "family-friendly choices",
  "boosting energy through the day",
  "small weekend changes",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pickRandom(list, count) {
  return [...list].sort(() => Math.random() - 0.5).slice(0, count);
}

async function askGemini(prompt) {
  let lastError = "Unknown error";

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent?key=" +
        process.env.GEMINI_API_KEY;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 1.2,
            topP: 0.95,
          },
        }),
      });

      const data = await response.json();

      if (!data.error) {
        console.log(`Success with model: ${model}`);
        return data.candidates[0].content.parts[0].text;
      }

      lastError = data.error.message;
      console.log(`${model} try ${attempt} failed: ${lastError}`);

      const busy = [429, 500, 503].includes(data.error.code);
      if (!busy) break;

      await sleep(2000 * attempt);
    }
  }

  throw new Error(lastError);
}

app.get("/", (req, res) => {
  res.json({ message: "VitaGuide server is running!" });
});

app.post("/api/tips", async (req, res) => {
  try {
    const {
      name, age, gender, height, weight, activity, goal,
      diet, sleep: sleepHours, water, work, language,
    } = req.body;

    const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
    const foods = pickRandom(FOODS, 6).join(", ");
    const focus = pickRandom(FOCUS, 1)[0];
    const variation = Math.floor(Math.random() * 100000);

    const langRule =
      language === "Urdu"
        ? "Write all text in Urdu script."
        : language === "Roman Urdu"
        ? "Write all text in Roman Urdu (Urdu written in English letters)."
        : "Write all text in simple English.";

    const prompt = `
You are a friendly wellness assistant. Give general, non-medical wellness tips.
Rules:
- Do NOT diagnose any disease and do NOT recommend medicines or supplements.
- Do NOT suggest extreme dieting or very low calorie eating.
- Use Pakistani foods. For variety, feature some of these this time: ${foods}.
- This time focus on: ${focus}.
- Variation code: ${variation}. Make every answer fresh and different from typical answers. Avoid generic repeated phrases.
- Keep each tip short, practical and specific to this person.
- ${langRule}

Person details:
- Name: ${name || "friend"}
- Age: ${age}
- Gender: ${gender}
- Height: ${height} cm, Weight: ${weight} kg, BMI: ${bmi}
- Daily routine: ${work}
- Activity level: ${activity}
- Goal: ${goal}
- Diet preference: ${diet}
- Sleep per night: ${sleepHours} hours
- Water per day: ${water} glasses

Return ONLY valid JSON in exactly this format (keep the keys in English):
{
  "summary": "2 friendly sentences about this person's situation",
  "diet": ["tip", "tip", "tip", "tip"],
  "exercise": ["tip", "tip", "tip"],
  "sleep": ["tip", "tip"],
  "hydration": ["tip", "tip"],
  "stress": ["tip", "tip"],
  "mealPlan": {
    "breakfast": "one meal idea",
    "lunch": "one meal idea",
    "snack": "one snack idea",
    "dinner": "one meal idea"
  },
  "challenge": "one small fun challenge for today",
  "quote": "one short motivational line"
}
`;

    let text = await askGemini(prompt);
    text = text.replace(/```json|```/g, "").trim();

    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Error:", error.message, error.cause);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});