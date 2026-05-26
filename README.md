# AgriShield AI

AgriShield AI is a Progressive Web App (PWA) for crop damage verification and insurance settlement processing. It combines AI crop diagnostics, GPS-geotagged submission feeds, and automated weather APIs to expedite claims processing for smallholder farmers.

---

## 🌟 Key Features

1. **Role-Based Workflows**: Dedicated dashboard structures for:
   - **Farmers**: Track policies, view live claims progress timelines, and receive in-app notifications.
   - **AEW Workers**: Fill out field surveys, capture GPS coordinate locks, attach photos, and sync offline drafts.
   - **District Officers**: Review statistics, inspect AI diagnostics, verify weather correlation records, and approve, reject, or request resurveys.
2. **Anti-Fraud Verification**:
   - **GPS Coordinates Capture**: Captures location automatically and matches with weather records.
   - **Weather Heuristics**: Automatically queries OpenWeatherMap API to match weather logs with damage types (e.g. checks if high temperature + dry humidity aligns with Drought claims). Mismatches flag claims as **Suspicious**.
3. **Bilingual Usability**: Full client-side localization support in **English** and **Hindi**, optimized for rural operations.
4. **Resilient Offline Caching**: Stores unfinished forms locally in local storage drafts, allowing AEW workers to document damages offline in low-connectivity fields and sync them back to the server when connection is restored.
5. **Inline AI Crop Diagnostic Widget**: Simulates AI model inference when crop images are uploaded, calculating crop health index and damage severity to show immediate recommendation tips.

---

## 💻 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, next-pwa, Lucide icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose ORM), jsonwebtoken, bcryptjs, multer.

---

## 📂 Codebase Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB connections
│   │   ├── controllers/     # Auth, Surveys, Claims, Notifications
│   │   ├── middleware/      # JWT protection, role guards
│   │   ├── models/          # User, Survey, Claim, Notification, AI, Weather schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # AI mock engine, weather verify, file handlers
│   │   └── server.ts        # Express entry point
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── app/                 # Next.js pages (auth, dashboards, layouts)
│   ├── components/          # Reusable header navbar and UI cards
│   ├── hooks/               # AuthContext, LanguageContext
│   ├── public/              # Icons and PWA manifest
│   ├── services/            # Axios API instances
│   ├── translations/        # en.json and hi.json localization dictionary
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB installed locally or MongoDB Atlas connection

### 1. Database & Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure `.env` variables (a default development `.env` has been set up with fallback settings):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/agrishield
   JWT_SECRET=super_secret_dev_key_123456
   JWT_EXPIRES_IN=7d
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   FRONTEND_ORIGIN=http://localhost:3000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Set up environment variables in a `.env.local` if needed (defaults to `http://localhost:5000/api`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:3000` to interact with the application.

---

## 🔒 Security Implementations

- **Helmet**: Secures HTTP headers.
- **Express Rate Limiter**: Limits brute-force login attempts to 100 requests per 15 minutes.
- **Mongo Sanitize**: Safeguards database against NoSQL injection vectors.
- **Bcryptjs**: Hashes user passwords using salts.
- **JWT Middleware**: Role protection restricts operations based on AEW, Farmer, or Officer designations.
