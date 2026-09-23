# GLA LMS_3CB_G-5: Web-Native Learning Management System

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)

A lightweight, purely client-side Learning Management System designed to handle complex academic workflows—including role-based routing, course management, and assignment evaluations—without relying on a traditional backend server or external frameworks.

## 🎯 Project Objectives & Constraints
This project was architected under a **Zero-Dependency Mandate**:
1. **No Backend Servers:** All logic, authentication, and routing are executed purely via client-side JavaScript (ES6+).
2. **No External Frameworks:** The UI is constructed using 100% custom CSS3 (Flexbox/Grid) without Bootstrap or Tailwind.
3. **Local State Persistence:** Data is initially seeded via `.json` files and dynamically migrated to the browser's `localStorage` to simulate full CRUD (Create, Read, Update, Delete) database operations across user sessions.

## 🏗 Architecture (3-Tier Client Model)
- **Tier 1: Presentation (HTML/CSS):** Responsive, role-specific dashboard views.
- **Tier 2: Controller Logic (JS):** Authentication guarding, DOM manipulation, JSON data parsing, and state management.
- **Tier 3: Persistence (JSON & LocalStorage):** Local state acting as a mock database for Users, Courses, and Submissions.

## 🚀 Core Features
* **Role-Based SPA Routing:** Simulates a Single Page Application experience by dynamically injecting Admin, Teacher, or Student interfaces based on session credentials.
* **Admin Portal:** User and course creation logic mapped directly to local storage arrays.
* **Teacher Portal:** Interfaces to view enrolled students, distribute syllabi, and grade pending assignments.
* **Student Portal:** Dynamic course catalogs, material viewing, and simulated file submissions.

## 📂 Repository Structure
```text
LMS-Project/
├── css/
│   └── style.css            # Centralized CSS variables, responsive grid, UI tokens
├── data/
│   ├── users.json           # Seed data for authentication & roles
│   ├── courses.json         # Seed data for academic catalog
│   └── assignments.json     # Seed data for deadlines and max marks
├── js/
│   ├── auth.js              # Session gateway and route protection logic
│   ├── courses.js           # Dynamic DOM injection for course rendering
│   ├── assignments.js       # Client-side submission state tracking
│   ├── admin.js             # LocalStorage CRUD for platform management
│   └── teacher.js           # Grading logic and submission updates
├── index.html               # Entry point (Login Portal)
├── courses.html             # Main course dashboard
├── assignments.html         # Evaluation and submission interface
├── profile.html             # Dynamic user context view
├── admin.html               # Administrator dashboard
├── teacher.html             # Educator grading interface
└── README.md                # Architectural documentation
