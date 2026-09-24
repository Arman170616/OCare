# 🚀 Quick Start Guide - Water Donation Flow

## 📊 What Was Built

A complete **4-Step Water Donation Flow** that allows users to:
1. **Select Water Support** as donation type
2. **Choose a city** (Muscat, Salalah, Sohar, Nizwa, Sur, etc.)
3. **Pick a verified facility** (mosque or hospital in that city)
4. **Donate & track delivery** (received → preparing → on the way → delivered)

---

## 🎯 User Experience Walkthrough

### Homepage
```
┌─────────────────────────────────────────┐
│  OmanCare - Find a Need                  │
│  Choose a Place. Make an Impact.         │
│                                          │
│  [🩹 Donate Water Now]  [❤️ Help Near Me]│
│                                          │
│  Step 1: Select Donation Type            │
│  Step 2: Choose Your Location            │
│  Step 3: Find Verified Facilities        │
│  Step 4: Donate & Track Impact           │
└─────────────────────────────────────────┘
```

### Donation Flow Modal

**Step 1: Select Type**
```
┌─────────────────────────────────────┐
│ What would you like to donate?      │
│                                     │
│ [💧 Water Support]                  │
│ Provide clean water to mosques      │
│ and hospitals                       │
└─────────────────────────────────────┘
```

**Step 2: Choose Location**
```
┌─────────────────────────────────────┐
│ Where would you like to help?       │
│                                     │
│ ┌──────────┬──────────┬──────────┐ │
│ │ 📍 Muscat│ Salalah  │ Sohar    │ │
│ ├──────────┼──────────┼──────────┤ │
│ │ Nizwa    │ Sur      │          │ │
│ └──────────┴──────────┴──────────┘ │
└─────────────────────────────────────┘
```

**Step 3: Find Facilities**
```
┌──────────────────────────────────────┐
│ Select a facility in Muscat           │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 🏛️ Al Rahman Mosque            │  │
│ │ 📍 Al Khuwair, Muscat          │  │
│ │ ✓ Verified                     │  │ ← Click to select
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 🏥 Royal Oman Hospital         │  │
│ │ 📍 Seeb, Muscat                │  │
│ │ ✓ Verified                     │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Step 4: Amount & Details**
```
┌────────────────────────────────────┐
│ Selected Facility:                 │
│ 🏛️ Al Rahman Mosque                │
│ Al Khuwair, Muscat                │
│                                    │
│ Donation Amount:                   │
│ [50 OMR]  [100 OMR]  [250 OMR]   │
│ [Custom: _____ OMR]               │
│                                    │
│ Donor Name: [Ahmed Al-Mansuri  ] │
│ Email:      [ahmed@example.com  ] │
│                                    │
│              [Complete Donation]   │
└────────────────────────────────────┘
```

**Step 5: Tracking**
```
┌─────────────────────────────────────┐
│ ✅ Donation Received!               │
│ Receipt: OMC-20260924-A1B2C3        │
│                                     │
│ Timeline:                           │
│ ✓ Received (2026-09-24 10:00 AM)  │
│   │                                │
│   ├─ 📦 Preparing                  │
│   │   (Current stage)              │
│   │                                │
│   ├─ 🚗 On The Way                 │
│   │                                │
│   └─ 📍 Delivered                  │
│                                     │
│ Amount: 100.000 OMR                │
│ Facility: Al Rahman Mosque         │
└─────────────────────────────────────┘
```

---

## 🏗️ Architecture at a Glance

### Frontend (React + TypeScript)
```
App.tsx
├── HomeView ["Donate Water Now" button]
├── DonationFlow [5-step wizard]
├── FacilitySelector [facility card]
└── DonationTracker [status timeline]
```

### Backend (FastAPI + SQLite)
```
GET /api/cities
→ Returns all cities

GET /api/facilities?city_id=XX&types=mosque,hospital
→ Returns verified facilities

POST /api/donations
→ Creates donation with facility_id

GET /api/donations/{id}
→ Gets donation details

PUT /api/donations/{id}/track
→ Updates delivery status (admin only)
```

---

## 🎬 How to Test

### 1. Start the app (already running):
```bash
# Frontend on port 5173
http://localhost:5173

# Backend on port 8000
http://localhost:8000/docs
```

### 2. Click "Donate Water Now" button
- Opens the donation modal with Step 1

### 3. Follow the 4 steps:
- **Step 1**: Click "Water Support"
- **Step 2**: Select "Muscat" (has most facilities)
- **Step 3**: Click "Al Rahman Mosque" or "Royal Oman Hospital"
- **Step 4**: Select amount (e.g., "100 OMR"), enter your name & email
- **Step 5**: See tracking with real-time updates

### 4. View your donation:
- Tracking shows status with timeline
- Auto-refreshes every 5 seconds
- Status updates as admin changes status

---

## 🔄 How Tracking Works

**User donates:**
```
POST /api/donations
{
  "facility_id": "fac-muscat-1",
  "amount": 100,
  "donor_name": "Ahmed"
}
↓
Creates donation with delivery_status = "received"
```

**User sees tracking:**
```
GET /api/donations/{id}
↓
Shows current status (starts as "received")
Auto-refreshes every 5 seconds
```

**Admin updates status:**
```
PUT /api/donations/{id}/track
{
  "delivery_status": "preparing"
}
↓
User sees status update on next auto-refresh
```

**Status flow:**
```
"received" → "preparing" → "on_the_way" → "delivered"
```

---

## 📱 Responsive Design

- ✅ Works on desktop
- ✅ Works on tablet
- ✅ Works on mobile
- ✅ Touch-friendly buttons
- ✅ Adaptive layout

---

## 🗂️ Key Files

| File | Purpose |
|------|---------|
| `DonationFlow.tsx` | Main 5-step wizard component |
| `FacilitySelector.tsx` | Facility card for selection |
| `DonationTracker.tsx` | Status timeline display |
| `HomeView.tsx` | Home page with donation button |
| `backend/app/main.py` | All API endpoints |
| `omancare.db` | SQLite database |

---

## 🎨 Design Colors

- **Primary**: Teal/Emerald (buttons, highlights)
- **Status Colors**:
  - Received: Teal ✓
  - Preparing: Blue 📦
  - On The Way: Amber 🚗
  - Delivered: Green 📍

---

## 💾 Database Structure

### donations table
```sql
- id (UUID)
- facility_id (foreign key)
- amount (decimal)
- donor_name (string)
- donor_email (string)
- receipt_number (unique)
- delivery_status (enum: received, preparing, on_the_way, delivered)
- delivery_updated_at (timestamp)
- created_at (timestamp)
```

### facilities table
```sql
- id
- name
- type (mosque, hospital)
- city_id
- address
- verification_status (verified)
```

### cities table
```sql
- id
- name
- lat, lng (coordinates)
- governorate
```

---

## 🚀 Performance

- ⚡ Auto-refresh every 5 seconds (not too fast, not too slow)
- 📦 Minimal data transfer
- 🎯 Direct facility selection (no need to browse projects)
- ✅ Receipt generated immediately

---

## ✨ Next Steps / Enhancements

Future features could include:
- [ ] SMS/Email notifications for status updates
- [ ] Social media sharing
- [ ] Impact stories/photos
- [ ] Donation certificates
- [ ] Export donation history as PDF
- [ ] Push notifications
- [ ] Multiple currency support
- [ ] Recurring/monthly donations

---

## 🐛 Troubleshooting

**Problem**: Modal doesn't open
- **Solution**: Check console for errors, ensure backend is running

**Problem**: Facilities not loading
- **Solution**: Verify backend is running on port 8000

**Problem**: Donation not submitted
- **Solution**: Check all fields are filled, backend console for errors

**Problem**: Tracking not updating
- **Solution**: Check backend is running, manually refresh if needed

---

## 📞 Support

- **Frontend issues**: Check browser console
- **Backend issues**: Check `http://localhost:8000/docs` for API status
- **Database issues**: Check `backend/omancare.db` exists

---

## ✅ Checklist

- [x] 4-step donation flow
- [x] City selection
- [x] Facility selection (mosque/hospital)
- [x] Real-time tracking
- [x] Delivery status updates
- [x] Receipt generation
- [x] Database integration
- [x] API endpoints
- [x] Frontend components
- [x] Responsive design
- [x] Error handling

---

**Status**: ✅ **LIVE & WORKING**

Both servers running. Click "Donate Water Now" to test!
