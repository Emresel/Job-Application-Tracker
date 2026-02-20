# Job Application Tracker - Term Project Presentation Notes

This document contains technical details and key points you can use while presenting your project to your professor via Teams. The topics professors focus on the most—**Database Design**, **Security**, and **Architecture**—are highlighted.

## 1. Database and Architecture (Likely the First Question)
Starting the presentation by opening the `server/schema.sql` file and going over it will be very effective. Academic-level comments have been added inside the file.

* **Relational Database:** SQLite is used in the project (chosen because it is lightweight and does not require a separate server process).
* **3NF (3rd Normal Form) Standard:** Tables are normalized to prevent data redundancy. For example, `companies` information is extracted into a separate table instead of being repeatedly written in the `applications` table, establishing a 1:N relationship via `companyID`.
* **Foreign Key Constraints:** Enabled using `PRAGMA foreign_keys = ON;`. 
  * For instance, an application (`applications`) is strictly tied to a user (`userID`). 
  * Relationships are strictly enforced to prevent orphan records during deletions or updates.
* **Audit_Log:** An `audit_log` table was designed to add security and traceability to the system. Only the *Admin* role can read this table to track who logged in or performed critical actions.

## 2. Security Measures (Details Professors Will Appreciate)
* **SQL Injection Protection:** All database queries in `server/index.js` use *Parameterized Queries*. User inputs are never appended into SQL strings via concatenation, thus completely preventing SQL Injection attacks.
* **Encryption (Bcrypt):** The `users` table stores `passwordHash` instead of plain `password`. User passwords are irreversibly encrypted using the `bcryptjs` library (Salting + Hashing) before saving to the database.
* **Authentication with JWT (JSON Web Tokens):** When a user logs in (stateless approach), a JWT token is generated. On every API request (e.g., fetching the application list), the server verifies this token (Authorization).
* **Brute-Force Protection (Rate Limiting):** `express-rate-limit` is added to the Login and Register endpoints. Any IP address making "5 failed attempts within 15 minutes" is temporarily locked out, effectively preventing brute-force attacks.
* **Role-Based Access Control (RBAC):** Roles such as Admin, Management, and Regular User are defined. Middleware checks like `requireRoles("Admin")` enforce access control at the API level.

## 3. Frontend and Technologies
* **React (Vite) & TypeScript:** A modern, component-based UI architecture is used. `Zustand` is preferred for State Management, and `React Query` for handling API requests.
* **Tailwind CSS & Shadcn UI:** Integrated for a clean, responsive design and ready-to-use modular UI components.

> **Recommended Presentation Flow:**
> 1. In screen sharing, first demonstrate the running project in the browser (Login, Dashboard, Adding a new application, Audit Log).
> 2. Then, switch to the code editor (VSCode) and open the most critical file, `server/schema.sql`, to explain the relationships.
> 3. Show the `/api/v1/auth/login` section in `server/index.js` to explain how passwords are verified and mention the Brute-Force protection to prove your technical knowledge.
