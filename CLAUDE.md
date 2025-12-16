# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIO Arbetsorder (All-in-One Work Order Management System) - A full-stack Firebase web application for managing work orders, time tracking, scheduling, and customer relationships. Built for All in one Sweden AB. The entire application is in Swedish.

**Tech Stack:**
- Frontend: React 18.2.0 (Create React App), React Router v7, FullCalendar v6
- Backend: Firebase (Auth, Firestore, Storage, Cloud Functions)
- Build: Create React App with default configuration
- Region: europe-west1 (Stockholm)

## Development Commands

### Frontend Development
```bash
npm install          # Install dependencies
npm start            # Start dev server on localhost:3000
npm run build        # Production build to build/
npm test             # Run tests with Jest
```

### Firebase Commands
```bash
firebase login                    # Authenticate
firebase deploy                   # Deploy everything
firebase deploy --only hosting    # Deploy frontend only
firebase deploy --only functions  # Deploy Cloud Functions only
firebase emulators:start          # Run local Firebase emulators
```

### Cloud Functions Development
```bash
cd functions
npm install          # Install function dependencies
```

## Architecture

### Frontend Structure

**Route Layout:**
- `/` - LandingPage.jsx (public)
- `/login` - LoginPage.jsx (auth)
- `/create-account` - CreateAccountPage.jsx
- `/dashboard` - Dashboard.jsx (main entry after login)
- All authenticated routes wrapped in `SidebarLayout.jsx` with collapsible navigation

**Key Pages:**
- **NewOrder.jsx** - Create work orders with customer selection, work type, billing type
- **OrderDetails.jsx** - 3-tab interface: order details, time reporting, scheduled time
- **RapporteraTid.jsx** - Time reporting with invoice preview and organization branding
- **Schema.jsx** - FullCalendar drag-and-drop scheduler with unassigned jobs sidebar
- **ReportsPage.jsx** - Time reports with PDF export (jsPDF + jspdf-autotable)
- **Settings pages** - Nested routes for users, time codes, organization

**Key Components:**
- **ArticlePicker.jsx** - Modal for searching articles catalog (by number, name, RSK)
- **SidebarLayout.jsx** - Navigation with hover expand/collapse behavior

**Styling Approach:**
- Inline CSS-in-JS throughout (no CSS framework)
- Color scheme: Blue primary (#3b82f6), status-specific colors
- Inter font with system font fallback
- Consistent card-based design with shadows and rounded corners

### Backend (Cloud Functions)

Location: `/functions/index.js`

**Functions:**
1. **processSupplierFileNew** (Storage trigger) - Processes CSV/TXT supplier price files uploaded to `supplierFiles/{supplierId}/`, parses with PapaParse, batch writes to `articles` collection
2. **inviteUser** (HTTP) - Creates Firebase Auth users and adds to `schedulableUsers` collection (TODO: needs admin authorization)
3. **uploadSupplierFile** (HTTP) - Currently minimal/disabled

Region: europe-west1

### Database (Firestore)

**Core Collections:**

1. **orders** - Work orders with fields:
   - orderNumber, customerId (ref), title, description, address
   - workType: (Bygg, El, Garanti, IT, Rivning, VVS, Anläggning, Övrigt)
   - status: (Planerad, Ej påbörjad, Pågående, Klar för fakturering, Full fakturerad)
   - priority: (Låg, Mellan, Hög)
   - billingType: (Löpande pris, Fast pris)
   - deadline, estimatedTime, assignedTo, billable, fixedPrice

2. **customers** - Customer database
   - name, customerNumber, address (full), phone, email
   - invoiceBy, paymentTerms, referencePerson

3. **tidsrapporteringar** - Time reports
   - arbetsorder (order ID), datum, antalTimmar, kommentar
   - godkand (approval status), timestamp

4. **scheduledJobs** - Calendar events
   - title, start/end (timestamps), allDay, userId (ref), orderId (ref)

5. **articles** - Product/service catalog
   - articleNumber, name, purchasePrice, unit
   - supplier: (Solar, Dahl, Egen)
   - category, rskNumber, lastUpdated

6. **schedulableUsers** - Users who can be scheduled
   - uid (Firebase Auth), email, name, role (user/admin)

7. **organization/details** - Single doc with company info
   - companyName, contact details, tax IDs, bank details
   - isFAproved, logoUrl, ourReference

**Important Indexes (firestore.indexes.json):**
- articles: (supplier ASC, name ASC)
- Additional needed for tidsrapporteringar, scheduledJobs queries

**Security Rules:**
- Current: Authenticated users can read/write all documents
- Production TODO: Implement role-based access control

## Common Patterns

### Firebase Integration
```javascript
// Standard pattern for Firestore queries
const ordersRef = collection(db, 'orders');
const ordersSnapshot = await getDocs(query(ordersRef, where('status', '==', 'Pågående')));
```

### Real-time Listeners
```javascript
// Used in components for live updates
useEffect(() => {
  const q = query(collection(db, 'orders'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Update state
  });
  return () => unsubscribe();
}, []);
```

### Navigation with Order Context
Order details link format: `/order/${orderId}` - Opens OrderDetails.jsx with 3 tabs

### PDF Generation
Uses jsPDF with autotable plugin. Organization branding fetched from `organization/details` document for headers/footers.

## Important Considerations

### Language Context
The application is entirely in Swedish:
- "Arbetsorder" = Work Order
- "Kunder" = Customers
- "Rapportera tid" = Report Time
- "Schema" = Schedule
- "Inställningar" = Settings
- "Leverantörer" = Suppliers

Keep all UI strings in Swedish when making changes.

### Firebase Configuration
Firebase config is in `src/firebase.js` with project ID: `aio-arbetsorder`

### CSV Processing
Supplier price lists (Solar, Dahl) are uploaded as CSV/TXT files. The Cloud Function `processSupplierFileNew` handles parsing with specific column mappings per supplier.

### Status Workflow
Orders follow this status progression:
Planerad → Ej påbörjad → Pågående → Klar för fakturering → Full fakturerad

### Billing Types
- "Löpande pris" (Hourly) - Uses time reports for invoicing
- "Fast pris" (Fixed price) - Uses fixedPrice field

## Known TODOs

- Admin authorization check in `inviteUser` Cloud Function
- Environment variables for sensitive config
- Tighter Firestore security rules with role-based access
- Complete supplier settings page (currently disabled)
- Implement proper error boundaries
- Add comprehensive test coverage

## Firebase Project Details

- Project ID: aio-arbetsorder
- Storage bucket: aio-arbetsorder.firebasestorage.app
- Hosting: aio-arbetsorder.web.app
- Functions region: europe-west1
