# GitInsight AI — Complete Platform Guide & Technical Documentation (`work.md`)

## 🌟 Overview: How GitInsight AI Works

**GitInsight AI** is a comprehensive, full-stack AI platform that analyzes GitHub developer profiles, benchmark technical skills, builds ATS-friendly resumes and dynamic portfolios, and empowers recruiters and enterprise companies with an AI-driven Applicant Tracking System (ATS).

The platform operates on a **hybrid architectural model**:
- **Frontend**: React 19 + Vite + Tailwind CSS / Vanilla CSS + Recharts + Lucide Icons.
- **Backend API**: Node.js + Express.js + JWT Auth + Bcrypt + Nodemailer.
- **Database Layer**: MongoDB (via Mongoose) with an automatic **instant in-memory DB fallback layer** (`dbStore.js`) so the entire application functions seamlessly online or offline.

---

## 🛠️ Implemented Features (Stages 1 – 9)

| Stage | Feature Name | Status | Description |
|---|---|---|---|
| **Stage 1** | **Developer Dashboard** | ✅ Active | Real-time GitHub profile analytics, repo lists, language breakdown, contribution statistics. |
| **Stage 2** | **Code Quality Reviewer** | ✅ Active | Deep repository inspector analyzing file structure, README quality, commit activity, and license data. |
| **Stage 3 & 4** | **Resume & Portfolio Studio** | ✅ Active | Automated generator producing ATS-ready PDF-style resumes and live portfolio previews. |
| **Stage 5 & 6** | **Multi-Profile Benchmarking** | ✅ Active | Side-by-side comparison engine for 2–5 GitHub profiles with Recharts Radar/Bar visualizations. |
| **Stage 7** | **Recruiter Portal** | ✅ Active | Dedicated recruiter dashboard, developer evaluation scores, candidate shortlisting, rating (⭐1–5), and notes. |
| **Stage 8** | **Auth & RBAC System** | ✅ Active | Full-stack JWT authentication, password hashing, password reset flow, and 4 user roles (`developer`, `recruiter`, `company_admin`, `super_admin`). |
| **Stage 9** | **Company Dashboard & ATS** | ✅ Active | Enterprise Applicant Tracking System featuring 9-stage Kanban pipeline, Job creation/publishing, Recruiter management, and analytics. |

---

## 👤 How Users Can Use the Platform

### 1. For Developers (`/` & `/dashboard/:username`)
1. **Analyze Your Profile**: Type any GitHub username into the top search bar (e.g. `torvalds`, `gaearon`, or your own username).
2. **Review Code Repositories**: Click on any repository to open the AI Code Reviewer (`/review/:username/:repo`) to inspect file trees and README documentation quality.
3. **Build Resume & Portfolio**: Navigate to Studio Builder (`/builder/:username`) to pick themes (Sleek Dark, Cyberpunk, Minimal Light), customize fonts, and generate an ATS-formatted resume.
4. **Account & Profile Settings**: Click **Sign Up** / **Sign In** to create an account, update personal bio, upload custom avatar, and manage security settings under `/account/profile`.

### 2. For Recruiters (`/recruiter/dashboard`)
1. **Click "Recruiter"** in the top navigation bar.
2. **Evaluate Candidates**: Go to **Candidate Search** (`/recruiter/search`), type a GitHub username, and hit **Evaluate**.
3. **Review AI Reports**: View the AI verdict, heuristic radar scores, detected technology stack, and job role compatibility percentages (`/recruiter/candidate/:username`).
4. **Shortlist Candidates**: Click **"Save Candidate"**. The developer is instantly saved to your shortlist (`/recruiter/shortlist`) where you can give star ratings (⭐1–5) and write interview notes.
5. **Real-time Company Sync**: Shortlisted candidates automatically sync to the Company ATS pipeline!

### 3. For Enterprise Companies (`/company/dashboard`)
1. **Click "Company ATS"** in the top navigation bar.
2. **Manage Job Postings**: Go to **Job Openings** (`/company/jobs`) to post new roles (Title, Department, Remote/Hybrid, Salary, Required Skills).
3. **Track Hiring Pipeline**: Open **Hiring Pipeline** (`/company/pipeline`) to view the interactive **9-stage Kanban Board**. Move candidates between `Applied`, `Screening`, `Shortlisted`, `Interview Scheduled`, `Offer Sent`, and `Hired`.
4. **Invite Recruiters**: Go to **Recruiter Team** (`/company/recruiters`) to add team members and assign job postings.
5. **Analyze Hiring Data**: Go to **Analytics & Reports** (`/company/analytics`) to view Recharts conversion funnels, skill distribution charts, and export CSV reports.

---

## ⚖️ Feature Evaluation: What is Good vs. What Needs Improvement

### 🌟 Outstanding & Highly Valuable Features (The Good)
1. **Real-time Recruiter → Company Sync**: When a candidate is shortlisted in the recruiter portal, they instantly populate the Company Kanban Pipeline and Overview analytics in real time without refreshing.
2. **Interactive Recharts Visualizations**: Radar charts for heuristic score benchmarking and Bar/Pie charts for hiring funnels and skill distributions provide instant visual clarity.
3. **Seamless Database Fallback (`dbStore.js`)**: The application never crashes even if local MongoDB is offline or disconnected; it gracefully switches to an in-memory store so all authentication and ATS operations work out-of-the-box.
4. **Multi-Role RBAC & JWT Security**: Clean separation between developer users, recruiters, and company admins with protected route guards.
5. **9-Stage Kanban Hiring Board**: Drag-and-drop / single-click stage transitions make candidate tracking fast and intuitive.

### ⚠️ Features That Could Be Improved in Future Updates
1. **Unauthenticated GitHub API Rate Limits**: Unauthenticated calls to GitHub's public API are limited to 60 requests per hour by GitHub. Adding an optional Personal Access Token input in Settings would solve this for heavy power users.
2. **Mock Filter Inputs on Candidate Search**: The search filters (e.g. Min Stars / Remote badges) currently act as visual shortcuts; expanding server-side GitHub user search queries would enhance deep filtering.
3. **Real PDF Export versus Browser Print**: Resume export currently uses browser print CSS (`@media print`); adding `html2pdf.js` would allow one-click binary PDF downloads directly.

---

## 🚀 Technical Stack Summary

- **Frontend Framework**: React 19 + React Router v7 + Vite 8
- **Icons & Charts**: Lucide React + Recharts 3.10
- **Backend API**: Node.js + Express.js + Mongoose 8
- **Security & Auth**: JsonWebToken + Bcryptjs + Helmet + Express Rate Limit
- **Mailing**: Nodemailer (Ethereal test SMTP)
