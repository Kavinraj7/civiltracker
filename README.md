# CivilCorp — Multi-Site Civil Organisation Financial & Operations Platform

A Next.js & Firebase platform engineered for civil construction organisations to manage projects across various locations, client finances, vendor material deliveries, worker wages, and project-to-project internal fund transfers.

---

## 🌟 Key Features

### 1. Projects & Client Management
- **Multi-Location Project Directory**: Create projects with site locations, start dates, and contract values/budgets.
- **Client Contact Details**: Integrated client profile (Client Name, Phone Number, Email, Office Address) on every project.
- **Deep-Dive Site Ledger**: View income, vendor expenses, worker wages, and cash position for any individual project.

### 2. Client Payments & Finance (Income)
- Record payments received from clients under the Project tab.
- Track Payment Mode (NEFT/RTGS, UPI, Cheque, Cash, Demand Draft), UTR/Cheque references, and milestone/RA Bill numbers.
- Real-time aggregation of Total Received Income per project and across the entire organization.

### 3. Vendor Management & Material Deliveries
- **Vendor Directory**: Manage suppliers (TMT Steel, Ready-Mix Concrete, Cement, Sand/M-Sand, AAC Blocks, Heavy Machinery, etc.) with GST, PAN, and bank payment details.
- **Individual Material Transactions**:
  - Choose which project the material was sent to.
  - Material description (e.g. *TMT Fe-550D 16mm*, *M25 RMC*, *River Sand*).
  - Quantity sent and Unit (*MT, Bags, Cu.M, Trips, Brass, Pieces, Hours*).
  - Total Bill Amount.
  - Amount paid so far.
  - **Auto-Calculated Pending Amount to be Paid** (`Total Amount - Paid Amount`).
  - Real-time status tags: *Paid in Full*, *Partially Paid*, *Unpaid (Due)*.
  - Quick action to record payment against pending balances.

### 4. Direct Project Expenses & Worker Wages
- Record daily/weekly wages to workers (labor mukadam, masons, bar benders, carpenters).
- Track site fuel & diesel, crane/equipment rental, site petty cash, testing lab fees, and permits.
- Keep cash slips and voucher numbers for every direct expense.

### 5. Organisation-Level Dashboard
- **Total Amount Received from Client**: Global client income.
- **Total Amount Sent to Vendors**: Cleared payments vs pending vendor payables.
- **Total Direct Expenses**: Worker wages and site consumables.
- **Total Overall Expenses**: Direct Site Expenses + Vendor Expenses.
- **Net Cash Surplus / Margin**: Total Income - Total Overall Expenses.

### 6. Internal Transfers (Separate Project KPI)
- **Dashboard Transfer Option**: Dedicated prompt: *"From what project to what project and how much amount"*.
- **Financial Neutrality**: Inter-project transfers move cash between site pools without distorting company-wide profits.
- **Separate KPI on Every Project**:
  - Transferred In (+) from other projects.
  - Transferred Out (-) to other projects.
  - Net Internal KPI Impact.

### 7. Authentication & Single Organisation Access
- **Firebase Authentication**: Multiple admin credentials can be created in Firebase Auth. Any admin who logs in sees the complete organisation data and dashboard.
- **Local Fallback Mode**: If Firebase credentials are not yet entered, the application runs with persistent browser storage and civil engineering seed data so you can test immediately.
- **In-App Firebase Configuration**: Set or update your Firebase keys via the top-bar database button or `.env.local`.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. One-Click Demo Login
On the login screen, click **"One-Click Admin Demo Login"** to immediately explore the system with pre-loaded civil construction projects, vendor transactions, worker wages, and internal transfers.

---

## 🔥 Firebase Setup Guide

To connect your own Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Authentication**, enable **Email/Password** sign-in provider. Create admin user accounts under the Users tab.
3. In **Firestore Database**, create a database (production or test mode).
4. In **Project Settings** -> **General**, create a **Web App** and copy the config credentials.
5. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
```
*(Alternatively, click the **"Database"** pill in the app header and paste the keys directly into the UI!)*

### Firestore Security Rules
Copy into the **Firestore -> Rules** tab in Firebase Console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated organisation admins can read & write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🧮 Financial Calculation Architecture

$$\text{Project Income} = \sum \text{Client Payments received for this project}$$

$$\text{Project Vendor Expenses} = \sum \text{Paid amounts to vendors for this project}$$

$$\text{Project Direct Expenses} = \sum \text{Worker wages, fuel, petty cash for this project}$$

$$\text{Project Total Spent} = \text{Project Direct Expenses} + \text{Project Vendor Expenses}$$

$$\text{Net Internal Transfer KPI} = \text{Transfers In} - \text{Transfers Out}$$

$$\text{Project Cash Position} = \text{Project Income} - \text{Project Total Spent} + \text{Net Internal Transfer KPI}$$

$$\text{Company Overall Cashflow} = \text{Total Client Income} - (\text{Total Direct Expenses} + \text{Total Vendor Paid})$$

