# 🌊 Water Donation Flow - Visual Architecture

## Component Hierarchy

```
App.tsx
├── Header
├── HomeView
│   ├── Hero Section
│   │   └── [Donate Water Now] ← Opens DonationFlow
│   ├── Donation Journey Steps
│   ├── Stats Cards
│   └── Category Cards
│
└── DonationFlow Modal (NEW!)
    ├── Step 1: Type Selection
    │   └── [Water Support] Button
    │
    ├── Step 2: Location Selection
    │   ├── Load Cities from API
    │   └── Display City Cards
    │       ├── Muscat
    │       ├── Salalah
    │       ├── Sohar
    │       └── More...
    │
    ├── Step 3: Facility Selection
    │   ├── Load Facilities by City
    │   └── FacilitySelector Components
    │       ├── [Mosque Card]
    │       │   ├── Name
    │       │   ├── Address
    │       │   └── Verified Badge
    │       └── [Hospital Card]
    │           ├── Name
    │           ├── Address
    │           └── Verified Badge
    │
    ├── Step 4: Amount & Details
    │   ├── Amount Selection
    │   │   ├── [50 OMR]
    │   │   ├── [100 OMR]
    │   │   ├── [250 OMR]
    │   │   └── [Custom Amount]
    │   ├── Donor Name Input
    │   └── Donor Email Input
    │
    └── Step 5: Tracking (NEW!)
        ├── Donation Received ✓
        ├── DonationTracker Component
        │   ├── Timeline Visualization
        │   │   ├── ✓ Received
        │   │   ├── 📦 Preparing
        │   │   ├── 🚗 On The Way
        │   │   └── 📍 Delivered
        │   ├── Donation Details
        │   │   ├── Amount
        │   │   ├── Facility
        │   │   └── Receipt #
        │   └── Auto-refresh (5s)
        └── [Close Button]
```

---

## Backend API Flow

```
Frontend                          Backend                     Database
─────────────────────────────────────────────────────────────────────

HomePage
  │
  └──> "Donate Water Now"
       │
       └──> GET /api/cities ──────────────────> Query cities table
            │                                   │
            └── Return cities list <─────────────┘

CitySelection (Step 2)
  │
  └──> GET /api/facilities?city_id=XX&types=mosque,hospital
       │
       └──────────────────────────────> Query facilities where:
           │                             - city_id matches
           │                             - type in (mosque, hospital)
           │                             - verification_status = verified
           │
           └── Return facilities <──────────┘

FacilitySelection (Step 3)
  │
  └──> User selects facility

DonationSubmit (Step 4)
  │
  └──> POST /api/donations ────────────────────> Check/Create project
       │                                         │
       │                                         ├─ If project missing:
       │                                         │  └─ Create water project
       │                                         │
       │                                         ├─ Insert donation record
       │                                         │  ├─ delivery_status="received"
       │                                         │  ├─ receipt_number="OMC-..."
       │                                         │  └─ created_at=now
       │                                         │
       │                                         └─ Update project amount
       │
       └── Return {id, receipt_number} ────────────┘

DonationTracker (Step 5)
  │
  └──> GET /api/donations/{donation_id} ────────> Query donation
       │                                         │
       │                                         ├─ Get delivery_status
       │                                         ├─ Get project info
       │                                         └─ Get facility info
       │
       └── Return donation details <─────────────┘
       
       Auto-refresh every 5 seconds ←───────┐
                                             │
                    Admin Backend Updates    │
                         │                   │
                         ├──> PUT /api/donations/{id}/track
                         │     {delivery_status: "preparing"}
                         │           │
                         │           └──> Update delivery_status
                         │                 └──> donations table
                         │
                         ├──> User sees update
                         │     on next refresh
                         │
                         └─────────────────┘
```

---

## Data Models

### City
```json
{
  "id": "muscat",
  "name": "Muscat",
  "governorate": "Muscat",
  "wilayat": "Muscat",
  "lat": 23.588,
  "lng": 58.3829
}
```

### Facility
```json
{
  "id": "fac-muscat-1",
  "name": "Al Rahman Mosque",
  "name_arabic": "مسجد الرحمن",
  "type": "mosque",
  "city_id": "muscat",
  "address": "Muscat",
  "lat": 23.595,
  "lng": 58.39,
  "verification_status": "verified",
  "verification_date": "2026-09-20"
}
```

### Donation
```json
{
  "id": "uuid",
  "facility_id": "fac-muscat-1",
  "user_id": "user-id",
  "donor_name": "Ahmed Al-Mansuri",
  "donor_email": "ahmed@example.com",
  "amount": 100,
  "currency": "OMR",
  "receipt_number": "OMC-20260924-A1B2C3",
  "status": "completed",
  "delivery_status": "preparing",
  "delivery_updated_at": "2026-09-24T10:30:00Z",
  "created_at": "2026-09-24T10:00:00Z"
}
```

---

## State Management Flow

### DonationFlow Component State
```typescript
interface DonationState {
  type: 'water' | null;              // Step 1
  city: City | null;                 // Step 2
  facility: Facility | null;         // Step 3
  amount: number;                    // Step 4
  donorName: string;                 // Step 4
  donorEmail: string;                // Step 4
  donationId: string;                // Step 5 (after submission)
  receiptNumber: string;             // Step 5 (after submission)
}

currentStep: 'type' | 'location' | 'facility' | 'amount' | 'tracking'
```

### DonationTracker Component State
```typescript
donation: Donation | null;           // Full donation details
loading: boolean;                     // API loading state
error: string;                        // Error message
// Auto-refreshes every 5 seconds
```

---

## Typical User Journey Timeline

```
TIME    ACTION                          STATE                  API CALL
────────────────────────────────────────────────────────────────────────
0:00    Click "Donate Water Now"       Modal opens            -
        Step 1 shows
        
0:05    Click "Water Support"          Step 2 loads           GET /api/cities
                                       Shows 5+ cities
        
0:10    Click "Muscat"                 Step 3 loads           GET /api/facilities
                                       ?city_id=muscat
                                       &types=mosque,hospital
                                       
0:15    Click "Al Rahman Mosque"       Step 4 shows           -
                                       Facility confirmed
                                       
0:20    Select Amount "100 OMR"        Amount selected        -
        
0:25    Enter Name & Email             Form complete          -
        
0:30    Click "Complete Donation"      Submission starts      POST /api/donations
                                                               {facility_id, amount...}
        
0:32    ✅ Donation Processed!         Step 5: Tracking       -
        Receipt: OMC-20260924-ABC123    Shows "Received"
        
0:35    Tracker refreshing...          Auto-refresh timer     GET /api/donations/{id}
        Status updates from backend     Interval: 5s
        
0:40    Prepare water for delivery     Status updates         PUT /api/donations/{id}
        (Admin updates via dashboard)   to "preparing"         /track (backend admin)
        
0:45    Tracker updates                User sees "Preparing"  GET /api/donations/{id}
        (next auto-refresh)                                    (auto-refresh)
        
1:00    Water sent to facility         Status updates         PUT /api/donations/{id}
        (Admin updates)                 to "on_the_way"        /track (backend admin)
        
1:05    Tracker updates                User sees              GET /api/donations/{id}
                                        "On The Way"
        
1:30    Water delivered                Status updates         PUT /api/donations/{id}
        (Admin/Facility confirms)       to "delivered"         /track (backend admin)
        
1:35    Tracker updates                User sees              GET /api/donations/{id}
        ✓ Donation Complete!            "Delivered"
        
ANY     View Donation History          All past donations     GET /api/donations
TIME    Click "Your Donations"          with tracking info     (filtered by user)
```

---

## Files & Locations

### Frontend Components
```
src/components/
├── DonationFlow.tsx          ← Main 5-step wizard
├── FacilitySelector.tsx      ← Facility card component
├── DonationTracker.tsx       ← Tracking timeline
└── DonateModal.tsx           ← Original modal (still available)

src/views/
├── HomeView.tsx              ← Modified with "Donate Water Now"
├── DonationHistoryView.tsx   ← New donation history view
└── ExploreView.tsx           ← Existing explore view

src/
├── App.tsx                   ← Modified to include DonationFlow
└── lib/
    ├── types.ts              ← Donation type definitions
    ├── api.ts                ← API fetch functions
    └── constants.ts          ← Constants
```

### Backend
```
backend/app/
├── main.py                   ← All endpoints
│   ├── GET /api/cities
│   ├── GET /api/facilities
│   ├── POST /api/donations
│   ├── GET /api/donations/{id}
│   └── PUT /api/donations/{id}/track
│
├── omancare.db              ← SQLite database
├── requirements.txt         ← Dependencies
└── __init__.py
```

---

## Environment & Servers

```
Frontend:        http://localhost:5173    (Vite Dev Server)
Backend API:     http://localhost:8000    (FastAPI)
API Docs:        http://localhost:8000/docs (Swagger UI)
Database:        SQLite (backend/omancare.db)
```

---

## Status Indicators Visual

```
Step 1: Select Donation Type
┌─────────────────────┐
│ ● Water Support     │ ← Selected (teal highlight)
└─────────────────────┘

Step 2: Choose Your Location
┌──────────┬──────────┬──────────┐
│ Muscat   │ Salalah  │ Sohar    │ ← City cards (clickable)
└──────────┴──────────┴──────────┘

Step 3: Find Verified Facilities
┌──────────────────────────────────┐
│ 🏛️  Al Rahman Mosque             │
│    📍 Muscat | ✓ Verified       │
│    Al Khuwair, Muscat            │
│                            ✓ ←── Selected
└──────────────────────────────────┘

Step 4: Donate & Track Impact
Amount Presets:
[50 OMR]  [100 OMR]  [250 OMR]  [Custom]

Step 5: Tracking Status
    ✓ Received (Completed - Teal)
    │
    ├─ 📦 Preparing (Current - Blue/Amber)
    │
    ├─ 🚗 On The Way (Not yet - Gray)
    │
    └─ 📍 Delivered (Not yet - Gray)
```

---

## API Response Examples

### GET /api/cities
```json
[
  {
    "id": "muscat",
    "name": "Muscat",
    "governorate": "Muscat",
    "wilayat": "Muscat",
    "lat": 23.588,
    "lng": 58.3829
  },
  {
    "id": "salalah",
    "name": "Salalah",
    "governorate": "Dhofar",
    "wilayat": "Salalah",
    "lat": 17.0151,
    "lng": 54.0924
  }
]
```

### GET /api/facilities?city_id=muscat&types=mosque,hospital
```json
[
  {
    "id": "fac-muscat-1",
    "name": "Al Rahman Mosque",
    "name_arabic": "مسجد الرحمن",
    "type": "mosque",
    "city_id": "muscat",
    "address": "Al Khuwair, Muscat",
    "verification_status": "verified",
    "verification_date": "2026-09-20"
  },
  {
    "id": "fac-muscat-2",
    "name": "Royal Oman Hospital",
    "type": "hospital",
    "city_id": "muscat",
    "address": "Seeb, Muscat",
    "verification_status": "verified"
  }
]
```

### POST /api/donations (Response)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "receipt_number": "OMC-20260924-A1B2C3",
  "amount": 100,
  "currency": "OMR",
  "status": "completed",
  "delivery_status": "received"
}
```

### GET /api/donations/{id}
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "facility_id": "fac-muscat-1",
  "amount": 100,
  "currency": "OMR",
  "donor_name": "Ahmed Al-Mansuri",
  "donor_email": "ahmed@example.com",
  "receipt_number": "OMC-20260924-A1B2C3",
  "status": "completed",
  "delivery_status": "preparing",
  "delivery_updated_at": "2026-09-24T10:30:00Z",
  "created_at": "2026-09-24T10:00:00Z",
  "project": {
    "id": "proj-id",
    "facility_id": "fac-muscat-1",
    "title": "Water Support for Al Rahman Mosque",
    "facility": {
      "id": "fac-muscat-1",
      "name": "Al Rahman Mosque",
      "address": "Al Khuwair, Muscat",
      "type": "mosque"
    }
  }
}
```

---

## ✅ Implementation Complete!

All 4 steps + tracking system working and integrated with both frontend and backend!
