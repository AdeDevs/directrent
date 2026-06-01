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

* **users**: Stores demographic profiles, account state, and roles.
* **listings**: Stores property parameters, geo-points, images, and review status.
* **verifications**: Stores KYC applications, document URLs, selfie links, validation histories, and admin reports.
* **conversations / messages**: Handles live chat tracking.
* **viewings**: Tracks scheduled tenant tours.

### Database Security (firestore.rules)
Database mutations are blocked or allowed based on several specific profiles:
* Any registered user can write their personal details. Users are restricted from altering secondary profiles.
* Agents can only read or edit listing items containing their unique, verified Agent ID.
* User suspension flags restrict reading or writing databases instantly.
* Read/Write permissions for the global verifications collection are restricted to administrators.

---

## 10. Operational Troubleshooting and Maintenance Protocols

### Issue: The AI Panel shows empty responses or breaks on client views
* **Origin**: malformed or truncated text objects returned by remote models.
* **Action**: Ensure '/src/utils/jsonParser.ts' is correctly imported inside the Approval panel to heal incoming structures.

### Issue: Port 3000 is occupied or unreachable
* **Origin**: A conflicting backend process is running.
* **Action**: Terminate the background application and restart the DirectRent development environment.

### Issue: Storage uploads fail on cross-origin requests
* **Origin**: Missing CORS permissions inside your active storage bucket.
* **Action**: Apply CORS policies to allow cross-origin requests from your active landing URL.

---
DirectRent is now completely documented, integrated with dynamic fallbacks, tested, compiled, and ready for hand-over!
