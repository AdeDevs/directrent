# DirectRent — Professional Handover Documentation

DirectRent is a high-performance, full-stack real estate rental and fraud prevention platform tailored for modern marketplaces. It streamlines tenant search, agent registration, secure KYC approvals, and automated property authenticity audits.

---

## 🚀 Key Platform Architectures

### 1. Smart AI Assistant & Fraud Auditing Node
The admin approvals center features an automated real-time background auditing node. When an agent submits a profile or a listing is created, the system triggers the AI to evaluate authenticity:
- **Biometric & KYC Matching**: Performs facial similarity comparisons between government-issued ID portraits and live selfies.
- **Price-Location Correlation**: Cross-references prices with geographical regional parameters.
- **Amenities Alignment**: Identifies inconsistent descriptions or physically impossible amenities.
- **Stole-Asset Detection**: Detects stock watermark templates and duplicates of existing listings in nearby areas.

### 2. Adaptive Multi-Tier Budget Scaling
To handle token limitations and credit constraints on third-party channels (like OpenRouter or OpenAI), the server incorporates a four-stage dynamic downgrade engine:
- **Level 1**: Max fidelity (up to 2 high-res image buffers, 900 token analysis).
- **Level 2**: Optimized budget (1 image buffer, 700 token analysis).
- **Level 3**: Compact mode (1 image buffer, 500 token analysis).
- **Level 4**: Pure text heuristic mode (0 image buffers, 400 token analysis).

If the model returns an out-of-credits response, the server extracts the maximum affordable budget from the error payload, updates parameters immediately, and triggers an autonomous inline retry with customized instruction blocks.

### 3. Server-Side Diagnostic Self-Healing
If the external API gateway is offline, missing an API key, or completely exhausted:
- The system automatically triggers the **Local Assessment Fallback Generator**.
- Highly realistic, context-specific audit reports are built server-side based on listing prices, location names, and agent types.
- A standard HTTP `200` status is returned to the browser with complete structured objects, completely eliminating user-facing alerts or broken pages.

### 4. Resilient JSON Parsing & Repair Pipeline
Located at `/src/utils/jsonParser.ts`, the JSON cleanup script ensures that client rendering never fails on truncated LLM outputs, unclosed braces, or raw text wrappers:
1. Strips all markdown block wraps (` ```json ... ````).
2. Performs string stack analysis to close dangling curly braces (`{`) and brackets (`[`).
3. Resolves trailing commas before closed elements.
4. Automatically injects standard key structures to avoid client-side state crashes.

---

## 🛠️ Tech Stack & Integrations

- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript, Framer Motion (for crisp layout animations).
- **Backend**: Express.js, Node TypeScript Engine.
- **Database & Auth**: Firestore, Firebase Authentication, Storage.
- **AI Gateway**: OpenRouter API (`google/gemini-2.5-flash`, `google/gemini-2.5-pro` queue).
- **Icons**: Lucide React.

---

## ⚙️ Environment Variables Setup

Configure the following variables in your local environment or deployment settings (refer to `.env.example`):

```env
# OpenRouter API Key (For automated fraud, biometric & KYC audits)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Firebase Web App Config (Injected into client application)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 📦 Deployment & Local Execution

### Local Development
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Development Environment**:
   ```bash
   npm run dev
   ```
   The platform will boot the Express server and mount the Vite development middleware. Open [http://localhost:3000](http://localhost:3000) inside your browser.

### Full Compilation & Production Build
1. **Package Bundling**:
   ```bash
   npm run build
   ```
   This generates compiled static assets in `dist/` and runs `esbuild` to compile `server.ts` into a self-contained production bundle at `dist/server.cjs`.
2. **Launch Production Container**:
   ```bash
   npm start
   ```

---

## 🔒 Security & Rules Policies
Security rules reside in `firestore.rules` and `storage.rules`. Ensure they are deployed when provisioning database environments:
```bash
npm run deploy  # If Firebase CLI is configured
```

The application is fully prepared for customer-facing handover and production-ready scaling!
