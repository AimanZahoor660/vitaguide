# VitaGuide: AI Wellness Tips Website

VitaGuide is a single-page website that gives personalized, general wellness tips to people in Pakistan. The user enters basic details and an AI model creates tips for diet, exercise, sleep, hydration and stress, using familiar Pakistani foods.

**Live demo:** https://vitaguide-backend.vercel.app

> VitaGuide gives general wellness information only. It is not medical advice and does not diagnose any condition or recommend medicines.

## Features

- Personalized tips from the user's age, gender, height, weight, routine, goal, diet, sleep and water intake
- Pakistani food suggestions (daal, sabzi, chana, lassi and more)
- Live BMI bar while filling the form
- Daily calorie estimate (Mifflin-St Jeor equation)
- Sample 1-day meal plan, daily challenge and motivational line
- English, Roman Urdu and Urdu (right-to-left) output
- "New Tips" button for fresh results on the same details
- Result history saved in the browser
- Copy and Print / PDF buttons
- Dark mode and fully responsive layout

## Tech Stack

| Part | Tools |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js (local), Vercel serverless function (live) |
| AI | Google Gemini API |
| Hosting | Vercel, GitHub |

## How It Works

1. The user fills in the form.
2. The browser sends the data to the `/api/tips` endpoint.
3. The backend builds a safe prompt with random foods and a random focus, so results change each time.
4. Gemini returns JSON, and the backend retries or switches model if one is busy.
5. The frontend shows the JSON as cards.

## Safety

- The prompt blocks diagnosis, medicine and supplement advice, and extreme dieting.
- A visible disclaimer is shown on the page.
- The API key is stored in an environment variable and is never uploaded to GitHub.

## Run Locally

```bash
git clone https://github.com/AimanZahoor660/vitaguide.git
cd vitaguide/backend
npm install
```

Create `backend/.env`:

```
PORT=5000
GEMINI_API_KEY=your_api_key_here
```

Start the server:

```bash
node server.js
```

Then open `public/index.html` in your browser.

## Project Structure

```
vitaguide/
├── api/tips.js        # Serverless API used on Vercel
├── backend/           # Express server for local testing
├── public/            # Frontend (HTML, CSS, JS)
└── vercel.json
```

## Author

**Aiman Zahoor**, BSCS graduate, AI/ML and Web Developer
Email: aimanzahoor08@gmail.com
