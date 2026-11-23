# Capstone Project 10: ShortLink – Bitly Clone

> **Web Development III Capstone Project**  
> Complete Full-Stack URL Shortener with MVC Backend, JWT Auth (Access + Refresh Tokens), Role-Based Access Control (RBAC), Device Analytics via MongoDB Aggregation Pipelines, and React Context API Frontend.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Submission Video Link](#-submission-video-link)
3. [Mandatory Syllabus Requirements Compliance](#-mandatory-syllabus-requirements-compliance)
4. [Technology Stack](#-technology-stack)
5. [System Architecture (MVC)](#-system-architecture-mvc)
6. [Database Schemas & Indexing](#-database-schemas--indexing)
7. [Unique Twist: Click Analytics Aggregations](#-unique-twist-click-analytics-aggregations)
8. [Authentication & RBAC](#-authentication--rbac)
9. [REST API Specification](#-rest-api-specification)
10. [Postman Collection](#-postman-collection)
11. [Frontend Architecture](#-frontend-architecture)
12. [Getting Started (Step-by-Step)](#-getting-started-step-by-step)

---

## 🎥 Submission Video Link

- **Google Drive Video (Code Walkthrough):** [https://drive.google.com/file/d/11C7Q79iYXWYDj-ouyrPj399cAGI1m_lv/view?usp=drivesdk](https://drive.google.com/file/d/11C7Q79iYXWYDj-ouyrPj399cAGI1m_lv/view?usp=drivesdk)
- **Video Description:** Complete walkthrough of all 27 project source files across MVC Backend and React Frontend with all green comments removed.
- **Interactive Player:** [http://localhost:5173/code_video.html](http://localhost:5173/code_video.html)

---

## 🎯 Project Overview

**ShortLink** is a production-grade URL shortener that empowers users to transform long destination links into concise, shareable URLs using either cryptographic random strings or customizable aliases. Link creators can configure expiration dates, view live engagement metrics, and dissect traffic sources. Administrators possess full visibility into platform-wide activity and can suspend abusive or malicious links.

### Core Features
- **Cryptographic Short Codes**: Generated using Node.js core `crypto` base64url generation (or custom user-selected aliases).
- **Fast 302 Redirection & Click Tracking**: Immediate redirection with atomic `$inc` click counters and non-blocking asynchronous click event capture.
- **Link Expiration**: Configurable timestamp; expired links return `410 Gone`.
- **JWT Access + Refresh Token Rotation**: 15-minute access tokens with 7-day refresh tokens stored securely in the database.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` roles, enforced via dedicated Express middleware.
- **Unique Twist: Device & Timeline Analytics**: MongoDB aggregation pipelines grouping clicks by calendar day and device type (Mobile, Desktop, Tablet, Other) extracted from the `User-Agent`.
- **Admin Supervision**: Admins can inspect global link directories, block abusive links with reason notes, and inspect system-wide device usage.

---

## ✅ Mandatory Syllabus Requirements Compliance

| Syllabus Requirement | Implementation Details | File References |
|---|---|---|
| **MVC Folder Structure** | Separated `models/`, `controllers/`, `routes/`, `middleware/`, `config/` | [`server/`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server) |
| **Environment Variables** | `.env` loaded via `dotenv`, git-ignored; sample in `.env.example` | [`server/.env.example`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/.env.example) |
| **Bcrypt & JWT Auth** | Passwords hashed with `bcryptjs`; JWT access (15m) + refresh (7d) tokens | [`authController.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/controllers/authController.js), [`tokenHelper.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/utils/tokenHelper.js) |
| **Protected & RBAC Routes** | `protect` verifies JWT; `authorizeRoles('admin')` restricts admin routes | [`authMiddleware.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/middleware/authMiddleware.js) |
| **Schemas & Relationships** | User -> Links (`createdBy`), Link -> Clicks (`linkId`), strict validations | [`User.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/models/User.js), [`Link.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/models/Link.js), [`Click.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/models/Click.js) |
| **Aggregation & Indexes** | Daily traffic and device breakdown aggregation pipelines; unique & compound indexes | [`linkController.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/controllers/linkController.js#L180-L245) |
| **Centralized Error Handler** | Catches `CastError`, `ValidationError`, duplicate key `11000`, JWT errors | [`errorMiddleware.js`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/server/middleware/errorMiddleware.js) |
| **Postman Collection** | Pre-configured collection with automatic token variables & full CRUD tests | [`ShortLink_API.postman_collection.json`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/postman/ShortLink_API.postman_collection.json) |
| **React Frontend** | React Router v6, controlled forms, Context API, protected routes, modern Zinc UI | [`client/src/`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/client/src) |

---

## 🛠 Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.21)
- **Database:** MongoDB via Mongoose (v8.9)
- **Authentication:** `jsonwebtoken` (JWT), `bcryptjs`
- **Core Utilities:** Node.js `crypto` (random short code generation)
- **CORS & Environment:** `cors`, `dotenv`

### Frontend
- **Library:** React (v18.3)
- **Build Tool:** Vite (v6.0)
- **Routing:** `react-router-dom` (v6.28)
- **State Management:** React Context API (`AuthContext`)
- **HTTP Client:** Native `Fetch API` with automatic token refresh interceptor

---

## 🏗 System Architecture (MVC)

```
Capstone_Project/
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Refresh, Logout, Me
│   │   ├── linkController.js     # Link CRUD & Aggregation Analytics
│   │   ├── adminController.js    # RBAC Platform moderation & stats
│   │   └── redirectController.js # Short URL 302 redirection & click logging
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect (JWT) & authorizeRoles (RBAC)
│   │   └── errorMiddleware.js    # Centralized 404 & error handlers
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt pre-save hook
│   │   ├── Link.js               # Link schema with compound indexes
│   │   └── Click.js              # Click schema with device/timestamp indexes
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── linkRoutes.js         # /api/links/*
│   │   ├── adminRoutes.js        # /api/admin/*
│   │   └── redirectRoutes.js     # /:code redirection
│   ├── utils/
│   │   ├── tokenHelper.js        # Access & Refresh token signing
│   │   └── deviceHelper.js       # User-Agent regex device/browser parser
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js                 # Express application entrypoint
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar with user/admin state
│   │   │   ├── ProtectedRoute.jsx# Auth route guard
│   │   │   ├── AdminRoute.jsx    # RBAC admin route guard
│   │   │   ├── CreateLinkModal.jsx # Controlled link creation modal
│   │   │   ├── AnalyticsModal.jsx# Aggregation data visualizer
│   │   │   └── Icons.jsx         # Lightweight SVG icon collection
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state & actions
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Landing page & feature showcase
│   │   │   ├── LoginPage.jsx     # Controlled login form
│   │   │   ├── RegisterPage.jsx  # Controlled registration with role selector
│   │   │   ├── DashboardPage.jsx # Link management & analytics trigger
│   │   │   ├── AdminDashboardPage.jsx # RBAC link & user moderation
│   │   │   └── NotFoundPage.jsx  # 404 handler
│   │   ├── services/
│   │   │   └── api.js            # Fetch API wrapper with silent refresh
│   │   ├── App.jsx               # Routes setup
│   │   ├── main.jsx              # DOM mount
│   │   └── index.css             # Zinc precision styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── postman/
│   └── ShortLink_API.postman_collection.json # Exported Postman collection
└── README.md
```

---

## 🗄 Database Schemas & Indexing

### 1. `User` Schema
- `name`: String, required, trim, max 50 chars.
- `email`: String, required, unique, lowercase, regex validated.
- `password`: String, required, min 6 chars (bcrypt hashed before save).
- `role`: String, enum: `['user', 'admin']`, default: `'user'`.
- `refreshToken`: String, stores current active refresh token.
- **Indexes:** `{ email: 1 }` (unique).

### 2. `Link` Schema (Relationship: User -> Links)
- `originalUrl`: String, required, regex validated (`http://` or `https://`).
- `shortCode`: String, unique, indexed, trimmed.
- `alias`: String, sparse unique index (custom user slug).
- `createdBy`: `ObjectId` referencing `User` model (`required: true`).
- `clicksCount`: Number, default: 0.
- `isBlocked`: Boolean, default: false (admin moderation flag).
- `blockReason`: String (admin reason note).
- `expiresAt`: Date, optional expiration timestamp.
- **Indexes:**
  - `{ shortCode: 1 }` (unique lookup)
  - `{ createdBy: 1, createdAt: -1 }` (compound index for rapid dashboard listing)
  - `{ alias: 1 }` (sparse index)

### 3. `Click` Schema (Relationship: Link -> Clicks)
- `linkId`: `ObjectId` referencing `Link` model (`required: true`).
- `ipAddress`: String, anonymized client IP.
- `userAgent`: String, raw header string.
- `deviceType`: String, enum: `['Desktop', 'Mobile', 'Tablet', 'Other']`.
- `browser`: String (e.g. Chrome, Firefox, Safari, Edge).
- `os`: String (e.g. Windows, macOS, iOS, Android, Linux).
- `referrer`: String (e.g. Direct, Google, Twitter).
- `timestamp`: Date, default: `Date.now`.
- **Indexes:**
  - `{ linkId: 1, timestamp: -1 }` (compound index for timeline queries)
  - `{ linkId: 1, deviceType: 1 }` (compound index for device aggregation)

---

## 📊 Unique Twist: Click Analytics Aggregations

The requirement mandates aggregation pipelines for **clicks by day** and **clicks by device type**.

### Aggregation 1: Traffic Grouped by Calendar Day
```javascript
const clicksByDay = await Click.aggregate([
  { $match: { linkId: new mongoose.Types.ObjectId(linkId) } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      clicks: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      date: "$_id",
      clicks: 1,
      _id: 0,
    },
  },
]);
```

### Aggregation 2: Traffic Grouped by Device Type
```javascript
const clicksByDevice = await Click.aggregate([
  { $match: { linkId: new mongoose.Types.ObjectId(linkId) } },
  {
    $group: {
      _id: "$deviceType",
      clicks: { $sum: 1 },
    },
  },
  { $sort: { clicks: -1 } },
  {
    $project: {
      device: "$_id",
      clicks: 1,
      _id: 0,
    },
  },
]);
```

---

## 🔐 Authentication & RBAC

1. **Access Token (`15m`):** Signed with `JWT_ACCESS_SECRET`. Sent in the `Authorization: Bearer <token>` header for all protected endpoints.
2. **Refresh Token (`7d`):** Signed with `JWT_REFRESH_SECRET`. Stored on the user document in MongoDB. The client exchanges this token via `POST /api/auth/refresh` when access expires.
3. **RBAC Guard (`authorizeRoles`):**
   ```javascript
   const authorizeRoles = (...roles) => {
     return (req, res, next) => {
       if (!req.user || !roles.includes(req.user.role)) {
         return res.status(403).json({
           success: false,
           message: `Forbidden: Requires one of [${roles.join(', ')}]`,
         });
       }
       next();
     };
   };
   ```

---

## 📡 REST API Specification

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user or admin |
| `POST` | `/api/auth/login` | Public | Sign in and receive tokens |
| `POST` | `/api/auth/refresh` | Public | Rotate/renew expired access token |
| `POST` | `/api/auth/logout` | Private | Revoke refresh token and logout |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated profile |

### Link Management (`/api/links`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/links` | Private | Create short URL (auto crypto code or custom alias) |
| `GET` | `/api/links` | Private | Get user's links (supports `?search=`) |
| `GET` | `/api/links/:id` | Private | Get single link details |
| `DELETE` | `/api/links/:id` | Private | Delete link and click history |
| `GET` | `/api/links/:id/analytics` | Private | **Aggregation analytics** (by day & device) |

### Redirection (`/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/:code` | Public | 302 Redirect to destination + asynchronous click logging |

### Admin Moderation & RBAC (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/links` | Admin Only | Inspect all platform links |
| `PATCH` | `/api/admin/links/:id/status` | Admin Only | Block or unblock link with reason note |
| `GET` | `/api/admin/users` | Admin Only | List all registered users and link counts |
| `GET` | `/api/admin/stats` | Admin Only | Platform-wide aggregation metrics |

---

## 📮 Postman Collection

A complete Postman collection is available at:
[`postman/ShortLink_API.postman_collection.json`](file:///c:/Web_Dev_3/Web_Dev_3/Capstone_Project/postman/ShortLink_API.postman_collection.json)

### How to Import and Test:
1. Open Postman &rarr; Click **Import** &rarr; Select `ShortLink_API.postman_collection.json`.
2. The collection includes pre-configured collection variables (`baseUrl`, `accessToken`, `adminAccessToken`, `refreshToken`).
3. Run **Login User** or **Login Admin** &rarr; Postman test scripts automatically store the tokens into collection variables for subsequent requests.

---

## 🚀 Getting Started (Step-by-Step)

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `127.0.0.1:27017` or a MongoDB Atlas connection string)

### 1. Backend Setup
```bash
cd server
npm install
npm run dev
```
*The server will start on `http://localhost:5000`.*

### 2. Frontend Setup
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
*Vite will launch the frontend on `http://localhost:5173`.*

### 3. Demo Accounts (Quick Testing)
- **Register User:** On the registration page, leave Role as **User**.
- **Register Admin:** On the registration page, switch Role to **Admin** to evaluate the RBAC moderation panel at `/admin`.
