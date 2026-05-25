# Velour Privacy Operations Platform

Velour is a modern consumer privacy management service and enterprise-grade remediation workflow system designed to help users identify, manage, and suppress personal data exposures across public record directories, registries, and databases.

Inspired by premium operations platforms like Stripe and Linear, Velour prioritizes user trust, data minimization, and clean compliance-oriented operations.

---

## Key Features

1. **Transient Registry Auditing**
   * Query regional database exposures securely.
   * *Zero-knowledge search design*: Queries are processed transiently and are not logged, stored, or shared.

2. **Secure Identity Verification**
   * Multi-stage identity assurance to verify record ownership and prevent unauthorized scraping.
   * Secure file upload and localized face-matching checks.
   * *Data Minimization*: Uploaded documents are encrypted and immediately removed from transient memory upon verification completion.

3. **Remediation & Deletion Opt-out Workflows**
   * Direct removal coordination tools for data brokers and legacy search registries.
   * Dynamic progress tracking status screens (Received, Processing, Suppressed).

4. **Compliance Operations Workspace**
   * Dedicated support administrator dashboard to monitor SLA metrics, verify client documents, and escalate opt-out packets.
   * Investor-ready, calm compliance presentation decks.

5. **AI Remediation Guidance**
   * Dynamic, personalized checklists compiled securely by Gemini based on exposed registry footprints.

---

## Technical Stack

* **Frontend**: React (TypeScript), Tailwind CSS (v4)
* **Backend**: Express, Node.js (`tsx` runtime)
* **AI Integration**: `@google/genai` (Gemini model series)
* **Icons**: `lucide-react`

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM

### Installation

1. Clone this repository:
   ```bash
   git clone git@github.com:Mattjhagen/Velour-live.git
   cd Velour-live
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

### Running Locally

To launch the backend server and development client:
```bash
npm run dev
```
The server will boot and serve the client locally (usually at `http://localhost:3000`).

### Production Build

To compile the production frontend client assets and backend bundle:
```bash
npm run build
```

To start the production server:
```bash
npm run start
```

---

## Operational Architecture

```
                                 [Client Workspace]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      [Transient Search Desk]                     [Identity Verification]
         (In-memory only)                          (Ephemeral OCR & Match)
                   │                                           │
                   ▼                                           ▼
      [Opt-out Coordination]                      [Suppression Certification]
         (Removal Ledger)                          (Unmasked Data Visibility)
```

## Security & Trust Commitments

* **Data Minimization**: We only store the minimum information required to verify ownership and coordinate removals.
* **Transient Search**: All search queries are non-persistent. We do not monetize query datasets or retain credentials.
* **Biometric Vector Safety**: Session calculations occur locally on-device and represent one-time matching challenge sequences.
