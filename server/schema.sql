-- =================================================================================
-- Job Application Tracker - Database Schema (SQLite)
-- 
-- Architecture Overview:
-- This database is designed following the principles of Relational Database
-- Management Systems (RDBMS) and adheres to 3rd Normal Form (3NF) to minimize
-- data redundancy and ensure data integrity.
-- 
-- Key Features:
-- - Enforcement of Referential Integrity (PRAGMA foreign_keys = ON).
-- - Use of Primary Keys (PK) for entity uniqueness.
-- - Use of Foreign Keys (FK) for establishing 1:N (One-to-Many) relationships.
-- =================================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------------
-- Table: users
-- Represents the core entity for Authentication and Authorization (RBAC).
-- Stores hashed passwords (via bcrypt) to prevent plaintext credential leaks.
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  userID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL, -- Stored securely using bcrypt algorithm
  role TEXT NOT NULL,         -- Role-Based Access Control: Admin | Management | Regular | Control
  userTypes TEXT              -- Categorization: JobSeeker, Analyst etc.
);

-- ---------------------------------------------------------------------------------
-- Table: companies
-- Normalization: Extracted from applications to prevent data duplication and 
-- update anomalies (1st/2nd Normal Form).
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  companyID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT
);

-- ---------------------------------------------------------------------------------
-- Table: categories
-- Relation: 1:N with users (A manager creates many categories).
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  managerID INTEGER NOT NULL,
  
  -- FK ensuring category metadata is strictly bound to an existing manager
  FOREIGN KEY (managerID) REFERENCES users(userID)
);

-- ---------------------------------------------------------------------------------
-- Table: applications
-- The central transactional table tracking job opportunities.
-- Relations: 
--   - N:1 with users (A user has many applications)
--   - N:1 with categories
--   - N:1 with companies
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  appID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  categoryID INTEGER,
  companyID INTEGER,
  company TEXT NOT NULL,          -- Caching name for rapid query (denormalization trade-off)
  position TEXT NOT NULL,
  status TEXT NOT NULL,           -- State machine (Applied, Interviewing, Offer, etc.)
  priority INTEGER NOT NULL DEFAULT 0,
  appliedDate TEXT NOT NULL,      -- ISO-8601 standardized date format
  deadline TEXT,
  notes TEXT,
  
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (categoryID) REFERENCES categories(categoryID),
  FOREIGN KEY (companyID) REFERENCES companies(companyID)
);

-- ---------------------------------------------------------------------------------
-- Table: application_history
-- Relation: 1:N with applications.
-- Purpose: Maintains an immutable log of status transitions (Event Sourcing simplified).
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_history (
  historyID INTEGER PRIMARY KEY AUTOINCREMENT,
  appID INTEGER NOT NULL,
  statusChange TEXT NOT NULL,
  feedback TEXT,
  updateDate TEXT NOT NULL,
  
  -- Cascade delete rule mechanism implicitly managed by application logic
  FOREIGN KEY (appID) REFERENCES applications(appID)
);

-- ---------------------------------------------------------------------------------
-- Table: reminders
-- Relation: 1:N with users, 1:N with applications.
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
  reminderID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  appID INTEGER,
  message TEXT NOT NULL,
  reminderDate TEXT NOT NULL,
  
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (appID) REFERENCES applications(appID)
);

-- ---------------------------------------------------------------------------------
-- Table: audit_log
-- Security & Auditing Layer: Records critical actions performed by users.
-- Relation: N:1 with users.
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  logID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  
  FOREIGN KEY (userID) REFERENCES users(userID)
);

