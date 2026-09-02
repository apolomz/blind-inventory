# BlindInventory

> An audit system, blind inventory control, and shift reconciliation tool designed for high-turnover retail businesses, optimized to prevent unfair wage deductions for shift personnel and unmonitored stock loss.

---

## Project Context

In high-turnover commercial environments (such as convenience stores or transport terminal retail points), manual counts and paper-notebook reconciliations create severe operational issues:

- **Phantom Shortages:** Accumulation of historical discrepancies from previous weeks being unfairly charged to the current shift's personnel.
- **Data Manipulation:** Employees altering or "fixing" numbers because they know the expected theoretical stock beforehand.
- **Lack of Traceability:** Inability to pinpoint the exact shift where a loss occurred.

**BlindInventory POS** solves this problem by implementing a **Blind Shift Inventory** workflow, freezing the initial inventory via the POS API and automatically crossing it against recorded sales.

---

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS  
  Modern interface optimized for rapid numeric keypad entry.

- **Backend:** Python with FastAPI  
  Business logic processing, asynchronous handling, and parsing scripts.

- **Local Persistence:** SQLite3  
  Embedded transactional database, highly resilient to power outages.

- **Data Processing:** Pandas  
  Used for parsing and cleaning CSV sales reports directly in RAM.

- **External Integration:** REST API connection with Alegra POS  
  Basic Authentication / Token authentication with CSV file fallback support.

---

## System Architecture

The system operates on a decoupled client-server architecture running locally:

```text
┌──────────────────────────────────┐
│     Frontend: React + Tailwind   │
└────────────────┬─────────────────┘
                 │
                 │ HTTP Requests
                 │ Localhost / REST API
                 ▼
┌──────────────────────────────────┐
│         Backend: FastAPI         │
│                                  │
│      Business Logic & APIs       │
└───────────────┬──────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌───────────────┐  ┌─────────────────────┐
│ SQLite (.db)  │  │    Alegra POS API   │
│ Local Storage │  │    HTTPS REST API   │
└───────────────┘  └──────────┬──────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Alegra Cloud      │
                    │      Servers        │
                    └─────────────────────┘

                    Fallback:
                    ┌─────────────────────┐
                    │    Sales CSV Files  │
                    └─────────────────────┘
```

---

## Core Features

### Shift Opening — Inventory Snapshot

Upon starting a shift, the system captures and freezes the initial inventory stock.

This snapshot becomes the immutable reference point for the entire shift.

### Blind Physical Count

The cashier enters physical inventory counts organized by category:

- Beverages
- Snacks / Chips
- Fried Foods
- Bakery
- Sweets

The cashier **does not see the expected theoretical stock**, preventing bias and intentional manipulation.

### Automatic Discrepancy Calculation

The system calculates the expected inventory using the recorded initial stock and sales:

```math
\text{Theoretical Stock} = \text{Initial Stock} - \text{Recorded Sales}
```

The physical count is then compared against the theoretical stock:

```math
\text{Difference} = \text{Physical Count} - \text{Theoretical Stock}
```

A negative result represents a shortage, while a positive result represents an excess.

### Monetary Valuation — COP

If a shortage is detected, the system calculates its economic value based on the corresponding product prices.

This allows the system to generate a clear monetary report for the shift.

---

## Blind Inventory Workflow

```text
                 SHIFT START
                      │
                      ▼
           ┌────────────────────┐
           │ Inventory Snapshot │
           │    Initial Stock   │
           └──────────┬─────────┘
                      │
                      ▼
           ┌────────────────────┐
           │  Blind Physical    │
           │       Count        │
           └──────────┬─────────┘
                      │
                      ▼
           ┌────────────────────┐
           │ Retrieve Recorded  │
           │       Sales        │
           └──────────┬─────────┘
                      │
                      ▼
           ┌────────────────────┐
           │ Theoretical Stock  │
           │ Initial Stock -    │
           │ Recorded Sales     │
           └──────────┬─────────┘
                      │
                      ▼
           ┌────────────────────┐
           │     Discrepancy    │
           │ Physical - Theory  │
           └──────────┬─────────┘
                      │
                      ▼
           ┌────────────────────┐
           │ Monetary Valuation │
           │       (COP)        │
           └────────────────────┘
```

---

## Installation & Local Setup

Follow these steps to clone and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/apolomz/blind-inventory-pos.git
cd blind-inventory-pos
```

### 2. Start the Backend — FastAPI

Open a terminal in the project root:

```bash
cd backend

python -m venv venv
```

Activate the virtual environment.

**Windows:**

```powershell
venv\Scripts\activate
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the development server:

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

### 3. Start the Frontend — React

Open another terminal in the project root:

```bash
cd frontend

npm install
npm run dev
```

The frontend will be available through the URL displayed by Vite in the terminal.

---

## Project Structure

```text
blind-inventory-pos/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Main Objectives

BlindInventory was designed around three primary objectives:

1. **Prevent unfair wage deductions** caused by historical inventory discrepancies.
2. **Reduce inventory manipulation** by hiding theoretical stock during physical counting.
3. **Improve traceability** by associating discrepancies with a specific shift.

---

## Author

**Jhoan Sebastian Fernandez**

Developed with a systems engineering approach focused on solving real-world business challenges.
