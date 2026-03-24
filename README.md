# Shree Patel Travels - CRM & Lead Management System

A modern, high-performance Customer Relationship Management (CRM) system built to handle transport inquiries, bus ticket bookings, and parcel logistics. Designed with a focus on speed, responsive design, and seamless follow-up tracking.

---

# ⚙️ Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Server & Client Components) |
| Language       | TypeScript                                          |
| Styling        | Tailwind CSS                                        |
| Database       | Supabase (PostgreSQL)                               |
| Authentication | Supabase Auth                                       |
| Icons          | Lucide React                                        |

---

# ✨ Key Features

## Smart Lead Management

Log and manage inquiries for two types of services:

### Bus Ticket Bookings

- Track seat requirements
- Source and destination routes
- Travel dates

### Parcel Transport

- Track parcel weight
- Manage transport routes
- Record dispatch details

---

## Dynamic Route Selection

Cities are dynamically loaded from the database.

Users can:

- Search existing cities
- Select routes instantly
- Add new cities directly from the inquiry form

This removes the need for manual database updates.

---

## Follow-Up Timeline Drawer

Each lead contains a **follow-up timeline** where staff can:

- View interaction history
- Log call notes
- Schedule future reminder dates
- Track communication history

The timeline opens in a **smooth slide-out drawer**, allowing users to manage follow-ups without leaving the page.

---

## Automated Status Tracking

Leads automatically move through different statuses:

- `New`
- `Follow Up`
- `Booked`
- `Cancelled`
- `Auto Closed`

This ensures no inquiry gets lost during the follow-up process.

---

## Customer Directory

Customer details are automatically saved for future use.

Stored information includes:

- Customer name
- Mobile number

When staff enters a mobile number, the system can **auto-fill existing customer details** to speed up lead creation.

---

## Role-Based Access Control (RBAC)

Two user roles exist within the system.

### Admin

Full system access including:

- Manage users
- Edit or delete cities
- Access all leads
- System administration

### Staff

Operational access including:

- Create leads
- Log follow-ups
- Manage customers

Staff **cannot**:

- Delete cities
- Manage users
- Access system-level controls

---

## Automated User Provisioning

New users created through **Supabase Auth** are automatically synchronized with the `public.users` table.

This is handled through **PostgreSQL triggers**, ensuring that every authenticated user has a corresponding database record with proper role management.

---

# 🗄️ Database Structure

The PostgreSQL database uses **strict typing with custom enums** and is organized into modular SQL files for easy migrations and version control.

### Core Modules

1. **Users**  
   Linked to Supabase Auth and stores:
   - user roles (`Admin` or `Staff`)
   - mobile numbers

2. **Cities**  
   Master list of transport destinations used for route selection.

3. **Customers**  
   Directory storing customer contact information.

4. **Leads**  
   Main transactional table storing:
   - inquiry types
   - routes
   - travel dates
   - seat counts or parcel weight
   - lead status
   - follow-up notes

5. **Triggers**  
   Automated PostgreSQL functions that handle:
   - user creation
   - role synchronization

---

# 🛠️ Local Development Setup

## 1. Clone the repository

```bash
git clone [https://github.com/sarikascc/BusCRM.git](https://github.com/sarikascc/BusCRM.git)
cd buscrm
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Environment Variables

Create a `.env.local` file in the root directory.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these credentials inside your **Supabase Project Settings**.

---

# 🧱 Database Setup (Migrations)

The database schema, Row Level Security policies, and triggers are located inside:

```
supabase/diff/
```

Run the following SQL files **in this exact order** using the Supabase SQL Editor.

```
01_users.sql
02_cities.sql
03_customers.sql
04_leads.sql
05_automatic_user_creation_trigger.sql
```

These files will create:

- Database tables
- Custom enums
- Relationships
- Row Level Security policies
- Automated triggers

---

# ▶️ Run the Development Server

```bash
npm run dev
```

Open the application in your browser:

```
http://localhost:3000
```

---

# 🔒 Security

This application uses **Row Level Security (RLS)** at the database level to enforce strict access control.

Security mechanisms include:

- Identity verification using `auth.uid()`
- Role checking via a `SECURITY DEFINER` function
- Protection against unauthorized access to Admin-only data
- Safe handling of API requests even if endpoints are exposed

This ensures **Staff users cannot bypass Admin restrictions**.

---
