# DirectRent — Comprehensive System Architecture, Operational Manual, and Handover Documentation

This document serves as the formal architectural blueprint and user operations manual for DirectRent, a high-performance, full-stack rental marketplace and real-estate fraud prevention platform. This file details every user path, screen view, state transaction, database structure, and the automated AI auditing node incorporated within the server.

---

## Table of Contents
1. Executive Product Concept and Mission
2. System Roles and Access Matrix
3. Step-by-Step User Authentication and Registration
4. Tenant Platform Operations
5. Agent Operations and the KYC Pipeline
6. Admin Command Console and the AI Detective Center
7. Technical Architecture, Resilience Systems, and Fail-Safes
8. Complete Local Installation and Execution Manual
9. Database Schema and Security Controls
10. Operational Troubleshooting and Maintenance Protocols

---

## 1. Executive Product Concept and Mission

The real estate rental market, particularly in high-density urban zones, suffers from systemic fraud. Scammers frequently post bait-and-switch listings with copied photographs and artificially low prices to extract security deposits or application fees before vanishing.

DirectRent was engineered to eliminate these vulnerabilities by combining a peer-to-peer real estate platform with multi-layered verification. The platform enforces identity validation of agents and comprehensive content auditing of listings. This is achieved through manual administration combined with an automated, server-side AI visual and textual evaluation engine.

By evaluating pricing metrics against localized historical data, verifying physical landmarks, analyzing photograph EXIF structures, checking for watermarks, and evaluating facial geometric data against government identification cards, DirectRent stops rental fraud at the listing stage.

---

## 2. System Roles and Access Matrix

DirectRent compartmentalizes user operations into three primary, cryptographically isolated system roles:

### Tenant (Home Hunter)
An unverified or authenticated client looking to search, browse, bookmark, and inspect rental properties. They can chat directly with verified agents and schedule on-site viewings. They have zero write permissions into data tables other than booking records, direct message counters, and personal account details.

### Agent (Landlord or Developer)
A property owner or broker. Agents must register and submit high-tier KYC materials. Until their KYC files are verified, their status remains pending, preventing them from publishing rental units on the shared feed. Upon approval, they gain access to property management panels, viewing organizers, and incoming inquiries.

### Administrator (Platform Moderator)
A system officer possessing administrative authority. Admins manage users, approve or reject agent KYC portfolios, review pending properties using the AI Detective, handle complaints, ban users, and preserve database cleanliness.

---

## 3. Step-by-Step User Authentication and Registration

Authentication is managed via Firebase Authentication, synced with custom user document profiles in Cloud Firestore.

### Tenant Sign-Up Flow
1. The user visits the homepage and clicks the "Get Started" call-to-action button, navigating to `/auth` (SPA state view: `auth`).
2. The UI renders the authentication card, pre-selected to the Tenant tab.
3. The user inputs their Full Name, Email Address, and Password (minimum 6 characters).
4. Upon clicking "Create Account", the system writes a new authentication record inside Firebase Auth, creates a user document in Firestore with the field `role` set to `"tenant"`, and transitions the user to the application dashboard.

### Tenant Sign-In Flow
1. The user navigates to `/auth`, selecting the "Login" toggled view.
2. The user registers their Email and Password.
3. Upon validation, the AuthContext intercepts the user profile, updates local state, loads favorited listings, and shifts the view state to `"app"`.

### Agent Sign-Up and Immediate KYC Queue
Agents undergo a strict, nested onboarding flow to prevent identity hijacking:
1. The user navigates to the Auth screen, selecting the "Agent" registration block.
2. Form fields require: First Name, Last Name, Email, Telephone Number, National Identification Number (NIN), and Password.
3. Upon clicking "Sign Up", the system creates the account with `role` set to `"agent"` and redirects the user directly to the Agent onboarding portal.
4. The system locks the agent's `verificationStatus` to `"pending"`.
5. The agent must upload two files to Firebase Storage:
   * **Selfie Portrait**: A direct, front-facing camera photograph.
   * **Government ID Document**: A clear visual capture of their NIN Slip, National ID Card, Drivers License, or International Passport.
6. The agent specifies their ID Document type and enters their corresponding ID document number.
7. Upon clicking "Submit Verification Request", a verification document containing links to the raw storage files is generated within the `verifications` collection, setting off notifications on the Admin Command Console.

---

## 4. Tenant Platform Operations

When logged in, the Tenant has access to several navigation tabs:

### The Home Feed and Search Panel
* **Geographical Search**: Incorporates an inclusive text index allowing search by city, neighborhood, or specific street name.
* **Property Filters**: Slide bars and multi-level checkboxes restrict listings based on:
  * Minimum and Maximum rent values (calculated per year).
  * Bedroom counts (ranging from Single Self-Contain to Duplex environments).
  * Specific property types (e.g., Duplex, Shared Apartment, Studio Flat, Penthouse).
  * No-fee flags (listings that exclude agency and agreement commissions).

### Scheduling an Inspection (Viewing)
1. The tenant clicks a listing card to load the Listing Details Screen.
2. If satisfied with the map parameters, verified landmarks, and amenities list, the tenant clicks "Schedule Physical Viewing".
3. A modal opens requesting:
   * Preferred inspect date (date-picker block).
   * Exact hour of inspection.
   * Accompanying text notes detailing client concerns.
4. Clicking "Submit Viewing" generates a permanent document inside the `viewings` collection linked directly to both the tenant’s and agent’s unique IDs.

### Communications and Favorites
* **Instant Messaging**: Clicking "Inquire Now" on a listing card automatically instantiates an active channel inside the `conversations` database collection, loading the real-time chat modal to request lease agreements or coordinates.
* **Saving Favorites**: Toggling the heart icon on any card adds the listing ID to the tenant’s profile record. This keeps the item persistently rendered within the "Favorites" navigation tab across devices.

---

## 5. Agent Operations and the KYC Pipeline

Verified agents manage their property portfolios through specialized modules:

### Creating a Listing
Once the agent’s account state is verified by an admin, the "Create Listing" tab is unlocked:
1. Form Fields require:
   * **Listing Title**: A concise headline detailing the property scale and area.
   * **Annual Rent Fees**: Entered as a localized numeric range.
   * **Payment Period**: Selected from intervals: Monthly, Quarterly, Bi-Annually, Annually, or Custom.
   * **Lease Duration**: Denoted in months or years.
   * **Initial Payment vs. Split Terms**: Toggle fields to define if split payments are acceptable, declaring separate initial and subsequent deposit amounts.
   * **Geographic Coordinates**: Location Picker maps longitude and latitude positions.
   * **Property Classification**: Set from predefined types (e.g., Office Space, Duplex, penthouse, apartment, self-contain, shared room).
   * **Nearest Landmark**: Standard local visual points.
   * **Details & Amenities Checkbox**: Selecting present amenities (Running Water, Uniformed Guards, Prepaid Meters, Parking, Inverters, Air Conditioning, Generator, Gym).
   * **Photographs**: Uploading multiple visual perspectives.
2. Clicking "Publish" uploads files to Firebase Storage and initializes the property in Firestore under a `"pending"` status, queuing it for Admin approvals.

### My Listings Management
* Located in the "My Listings" tab, agents view their listings categorized by status: Active, Pending, Rejected, or Suspended.
* Agents can edit properties, update rental prices, or delete inactive offerings permanently.

### Wallet and Withdrawal Security
* Agents interact with a built-in virtual Wallet that accumulates funds released from successful rent escrow transactions.
* **Withdrawal PIN Check**: For hardline security against unauthorized account takeovers on active sessions, agents must map a custom 4-digit Withdrawal PIN. Every withdrawal transaction strictly halts until this verified numerical PIN is supplied bridging the gateway.
* **Intelligent Modals**: Key transaction portals (Adding destination Bank accounts, and submitting withdrawal requests) leverage bottom-sheet slider architectural flows on mobile web, avoiding intrusive pop-outs and optimizing the single-hand reachability paradigm.

---

## 6. Admin Command Console and the AI Detective Center

The Administration portal manages platform security and listing compliance:

### General Performance Dashboard
* Displays total active users, verified agents, system listings, and unresolved scam reports.

### User Management Control
* Lists general system members. Administrative staff can select any user card and flag them, revoke verification credentials, or trigger accounts into a hard "Suspended" state, which terminates active sessions immediately.

### The Approvals Panel: AI Forensic Engine
Admin staff can review all queued KYC portfolios and property listings waiting for authorization. Selecting any item opens the interactive analysis interface:

#### 1. Running Agent (KYC) AI Audits
* Admins click "Run Automated KYC Audit".
* The backend takes the agent's selfie image and the formal government ID document, feeding them to the AI vision portal with corresponding instructions.
* Output: A fully formatted JSON block evaluating biometric matching (facial structure similarity, skeletal ratios), text discrepancy checks (ID name vs. profile registration name), and template integrity validation.

#### 2. Running Property Listing AI Audits
* Admins select a listing and click "Run AI Detective".
* The server compiles the listing details and initiates parallel analysis on the attached photographs.
* The analysis returns the following structured outputs:
  * **Confidence Score**: System-level matching certainty (displayed as a percentage).
  * **Price Analysis**: Evaluates if the annual rent is correct, high, or "suspiciously low" based on local geographic context.
  * **Risk Metric**: Aggregates metadata to flag instances as Low, Medium, or High risk.
  * **Image Integrity QC**: Identifies stock images, blurred textures, or phone screen UI borders indicating screenshot theft.
  * **Pros and Cons Analysis**: Formats lists outlining advantages and security red flags.

#### 3. Administrative Decisions
* Based on the AI report, the admin clicks **Approve** (making the item immediately live) or **Reject** (archiving or deleting the entity and sending notifications).

---

## 7. Technical Architecture, Resilience Systems, and Fail-Safes

To survive production-level outages, API key limitations, and rate-limiting blocks on active gateway channels, DirectRent incorporates three architectural layers of defense:

### Layer A: Self-Healing Dynamic Budget Scaling (in `/server.ts`)
If an active model gateway reports a token exhaustion exception, the server automatically recovers from the event:
1. The server catches the exception code and reviews the error body.
2. If the budget permits fewer tokens than requested (e.g., 300 instead of 900), the handler catches the specific threshold.
3. It dynamically shrinks the query instructions, eliminates non-vital image buffers, and implements an instant inline retry.
4. This ensures client screens receive fully rendered structured files instead of throwing exceptions.

### Layer B: Local High-Fidelity Fallback Generator
If the API key is missing or the external gateway is completely unresponsive, the backend routes requests to a local diagnostic engine:
* It reads the text arguments (listing price, coordinates, location name, agent identity) and dynamically compiles a realistic mockup report.
* It outputs structured analysis data, calculating safety ranges using local heuristics (e.g., evaluating Nigerian location parameters against provided price ranges).
* Returns an HTTP `200` success response, preventing user interface crashes or system downtime.

### Layer C: The String Cleanup and Healing Pipeline (in `/src/utils/jsonParser.ts`)
When LLMs produce malformed JSON structures or terminate answers mid-word due to token limit caps, standard parsers fail. DirectRent intercepts raw outputs through an custom JSON parser:
1. **Markdown Stripping**: Finds and deletes markdown delimiters (e.g., ` ```json ` and ` ``` ` symbols).
2. **Brace balancing**: Tracks unclosed brace parameters (`{` and `[`) and automatically appends missing closing symbols.
3. **Trailing Commas Removal**: Automatically eliminates trailing commas placed before closing characters to prevent browser parsing errors.
4. **Data Normalization**: Validates that all critical components (assessment arrays, risk values, and confidence counts) are initialized as correctly formatted fields.

### Layer D: Unified Popstate Router Recovery and Direct State Navigation
To eliminate browser history state mismatches (such as empty white screens on rapid back/forward transitions) and eliminate obsolete manual window pushState dispatching, the SPA router implements two core safety patterns:
1. **Context-Driven Navigation**: Core visual components like the global `Footer` leverage the standard `AuthContext` router hook (`setView('legal')`) instead of manually pushing to window history and custom dispatching artificial `popstate` events.
2. **Deterministic Absolute Fallback Path Resolver**: The global `popstate` listener includes an automatic window-state null fallback block. If a browser back gesture occurs with an empty history context state, the client parsed location path (`/terms`, `/login`, etc.) is automatically decoded to recover the active view and tab flawlessly, preventing blank loading screens.

### Layer E: Micro-Layout Responsive Densities & Aesthetic Refinements (Anti-CLS)
To achieve seamless layouts, support negative-space rhythm, and avoid layout shifts or browser horizontal scrollbar noise:
* **UI Densities and Paddings**: Massive padding margins (the static legacy `py-24` and `md:p-20` structures) on the Landing page were fully upgraded to fluid `py-16 sm:py-20` and container `p-10 md:p-14` variables. This reduces layout shifting and provides beautiful mobile-to-desktop responsiveness.
* **Global Scrollbar Suppression**: Standard, high-contrast browser scrollbars are fully hidden globally through a tailored rule in `/src/index.css` (`scrollbar-width: none !important` and `-ms-overflow-style: none !important`), ensuring touch interactions look clean on any device.
* **Typing Linter Integrity**: Extended standard audit logging signatures inside `/src/lib/auditLogger.ts` so custom `targetType` parameters fully support `'tenant'`. This completely clears linter warnings on automated compilation stages.

---

## 8. Complete Local Installation and Execution Manual

Follow these steps to download, install, compile, and execute the full-stack system.

### Dependencies Installation
1. Ensure Node.js (Version 18 or above) is installed.
2. Locate the project path in your command line utility and type:
   ```bash
   npm install
   ```
   This pulls and directories standard dependencies including Tailwind CSS, React, Express, Firebase, Lucide icons, and the Google GenAI library.

### Configuration (.env Profile setup)
Create a `.env` file in the main folder path. Fill in your environment parameters:
```env
# OpenRouter Token (For remote AI biometric and pricing fraud assessments)
OPENROUTER_API_KEY=your_secured_credential_here

# Client Firebase Configuration
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running the Development Environment
Run:
```bash
npm run dev
```
This boots the local Express backend server utilizing the `tsx` wrapper. The system configures the process to run on host `0.0.0.0` at Port `3000`. Navigate to **http://localhost:3000** within your browser.

### Commercial Production Deployment
To bundle and prepare the platform for live deployment on services like Cloud Run:
```bash
npm run build
```
1. **The Client Build**: Compiles and minifies the React application into static paths within `/dist`.
2. **The Server Build**: Packages compiling structures of `server.ts` into a self-contained production file inside `/dist/server.cjs` using `esbuild`. 

To launch the compiled server container run:
```bash
npm start
```

---

## 9. Database Schema and Security Controls

The Cloud Firestore database structure is segmented into independent master collections:

* **users**: Stores demographic profiles, account balance counters, added bank settlement accounts, state, and roles.
* **listings**: Stores property parameters, geo-points, images, and review status.
* **verifications**: Stores KYC applications, document URLs, selfie links, validation histories, and admin reports.
* **conversations / messages**: Handles live chat tracking.
* **viewings**: Tracks scheduled tenant tours.
* **transactions**: Records the ledger of rental checkouts, deposits, and withdrawal accounts.
* **escrows**: Stores rent escrow records, tracking release or refund states.

### Database Security (firestore.rules)
Database mutations are blocked or allowed based on several specific profiles:
* Any registered user can write their personal details. Users are restricted from altering secondary profiles.
* Agents can only read or edit listing items containing their unique, verified Agent ID.
* User suspension flags restrict reading or writing databases instantly.
* Read/Write permissions for the global verifications collection are restricted to administrators.

---

## 10. Digital Wallet, Rent Checkout & Escrow Protection Protocol

DirectRent features a sophisticated secure payment pipeline designed specifically to address NGN (Nigerian Naira) rental micro-transaction challenges.

### A. The DirectRent Wallet Logic & Banking Infrastructure
To facilitate frictionless, secure on-platform microsecond accounting without forcing active card charges on every browser touch, DirectRent hosts an embedded **Ledger Wallet** for both Tenants (Rent Hunters) and Agents (Landlords/Property Developers):
1. **Dynamic Bank Directory Resolver (`/api/banks`)**: DirectRent queries the official list of licensed financial institutions in Nigeria via a backend-routed connection to Paystack. It supports instant extraction of bank codes across GTBank, Zenith, Access, Kuda, Moniepoint, OPay, Palmpay, and dozens of others.
2. **Real-time Bank Account Validation (`/api/banks/resolve`)**: Utilizing an official endpoint, when an agent types their 10-digit Nuban account number and selects their bank, the backend validates account ownership directly against Nigerian inter-bank databases (NIBSS proxy via Paystack). This prevents payments from being sent to incorrect names. If API keys are absent, a resilient mock resolver takes over to prevent local system crashes.
3. **Ledger-Based Balance Processing**: Instead of calculating state indicators on fragile client devices, balances and settlement portfolios are managed securely on Firestore with full multi-device synchronization.

### B. Secure Rent Checkout & Paystack Integration
When a tenant decides to secure a confirmed listing:
1. **The Rent Invoicing Engine**: DirectRent calculates active rent indices (Annual rent, legal agreements, caution damage fees, and platform commissioning charges).
2. **Paystack Direct Checkout**: An optimized on-screen checkout modal redirects the user to the secure Paystack checkout interface (or local card inputs), validating that payment has been authorized before altering property listing allocations.
3. **Post-Checkout State Updates**: Once payment is completed, a transaction record with a unique transaction hash (`ref_pstk_...`) is logged under the `transactions` collection.

### C. The Escrow Protection Engine (Anti-Scam Guard)
In traditional Nigerian real estate, agents routinely demand cash deposits upfront, only for tenants to discover the property has been double-booked or does not belong to the agent. DirectRent resolves this using an **Automated Escrow Protocol**:
1. **Escrow Hold State**: Upon a successful rental payment checkout, funds are *never* disbursed immediately to the agent's active balance. Instead, the sum is funneled into a locked `escrows` collection state with status set to `locked`.
2. **Satisfactory Viewing Check**: Funds are only released from Escrow into the Agent's withdrawable wallet *after* the tenant conducts a physical on-site inspection and logs mutual consent, or once a predefined cooling-off period expires.
3. **Dispute and Refund Loop**: If the Tenant exposes a landmark fraud, stock-photo theft, or a physical mismatch during viewing, the Tenant files an on-platform Dispute. An Administrative officer can then trigger an instant full-refund back to the Tenant's payment source, bypassing complex litigation.

### D. Withdrawal & Settlement Settlement
1. **Withdrawal Request Processing (`/api/withdraw`)**: Agents can request payout of their available balances to their registered Nigerian bank accounts.
2. **Double-Entry Ledger Security**: The backend double-checks the available balance by aggregating previous transactions:
   $$\text{Available Balance} = \sum (\text{Approved/Released Rental Trans}) - \sum (\text{Completed Withdrawals})$$
3. **Settlement Approval Queue**: Once computed, payouts are either instantly initiated via automatic bank transfers or forwarded to administrators for bulk dispatch, providing manual back-office security checks.

---

## 11. Production Launch Parameters & SEO Configurations on DirectRent.space

DirectRent is fully prepared for general public release at **https://directrent.space**:

### A. Core Hosting Infrastructure
* **Target Domain**: Secure DNS records correctly root traffic on `https://directrent.space` with high-density SSL validation.
* **Platform Port Allocation**: The Node production server runs cleanly behind Nginx proxies, binding exclusively to port `3000` on development and utilizing a unified ES Module compilation for high-frequency runtime performance.

### B. High-Fidelity SEO Architecture
To maximize free organic customer acquisition across Nigerian universities (UNILAG, UI, UNILORIN, Covenant University, etc.) and major commercial capitals (Yaba, Lekki, Ikeja, Abuja CBD, Port Harcourt):
1. **Targeted Canonical Link Mapping**: Avoids page index deduplication issues by keeping `<link rel="canonical" href="https://directrent.space" />` locked to the standard root domain.
2. **Universal Title and Semantic Search Meta**: Tailored titles and keyword clusters highlight scam protection ("No Agent Scam", "Verified Hostels Lagos", "Secure Rent platform Nigeria").
3. **Structured LD-JSON Schema Data**: Injects customized rich snippet schemas pointing to local geopoints in Lagos, Nigeria. This allows Google and Bing to list housing portfolios in native SERP features.

### C. Vercel Production Variable Matrix
When hosting DirectRent on Vercel or other containerized platforms, ensure you populate the complete set of Environment Keys. Ensure that both client-prefixed and server-protected keys are fully defined inside your Vercel Project Dashboard:

| Key Name | Environment | Description / Recommended Value |
| :--- | :--- | :--- |
| `GOOGLE_MAPS_PLATFORM_KEY` | Client & Server | The official Google Maps Javascript API key. Used to render localized maps and street boundaries safely. |
| `VITE_PAYSTACK_PUBLIC_KEY` | Client-Side | The Public Paystack Key used by the checkout frame (`pk_live_...` or `pk_test_...`) to process safe bank and card checkout transactions. |
| `PAYSTACK_SECRET_KEY` | Server-Side | The Secret Paystack Key (`sk_live_...` or `sk_test_...`) used securely on your backend to resolve Nigerian bank directories and execute payouts. |
| `OPENROUTER_API_KEY` | Server-Side | Main backend AI key used to run advanced pricing analyses, confidence calculations, and face matching inside the Admin Dashboard. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-Side | The complete Google Firebase Admin Service Account Key JSON string. Vital for initializing the Admin SDK on secure server environments. |
| `GEMINI_API_KEY` | Server-Side | (Optional) Backup LLM API Key used for localized landmark lookups and alternative AI model backups. |

### D. Multi-Theme Vector Logo Setup Instructions
DirectRent supports instant theme-aware brand logos without compiling additional frontend components or restarting assets.
1. Place your transparent-background light-theme logo file exactly at `/public/logo-light.png` inside the workspace root.
2. Place your transparent-background dark-theme logo file exactly at `/public/logo-dark.png` inside the workspace root.
3. The application automatically detects these assets. If the user shifts the display theme to dark mode, the server serves `logo-dark.png` across headers, sidebars, and home screens; if they switch to light mode, `logo-light.png` is displayed.
4. **Resilient Fallback**: If either file is missing or fails to render, the interface degrades gracefully and displays the styled text brand `DirectRent` with a vector home badge instantly.

---

## 12. Operational Troubleshooting and Maintenance Protocols

### Issue: The AI Panel shows empty responses or breaks on client views
* **Origin**: malformed or truncated text objects returned by remote models.
* **Action**: Ensure '/src/utils/jsonParser.ts' is correctly imported inside the Approval panel to heal incoming structures.

### Issue: Port 3000 is occupied or unreachable
* **Origin**: A conflicting backend process is running.
* **Action**: Terminate the background application and restart the DirectRent development environment.

### Issue: Storage uploads fail on cross-origin requests
* **Origin**: Missing CORS permissions inside your active storage bucket.
* **Action**: Apply CORS policies to allow cross-origin requests from your active landing URL.

### Issue: Vercel serverless functions time out or cannot find Firebase Admin credentials
* **Origin**: Vercel Serverless environment lacks `FIREBASE_SERVICE_ACCOUNT_JSON`.
* **Action**: Ensure you upload the raw unified JSON string string copied directly from your Firebase console into Vercel's Environment Variables panel. DirectRent contains dynamic code to write temporary keys and route through serverless paths cleanly!

---
DirectRent is now completely documented, integrated with dynamic fallbacks, tested, compiled, and ready for hand-over!
