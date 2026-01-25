-- SQLite schema (based on ErDiagramFinal.pdf + API docs)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  userID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,          -- Admin | Management | Regular | Control
  userTypes TEXT              -- comma-separated: JobSeeker,Analyst (for Regular)
);

CREATE TABLE IF NOT EXISTS companies (
  companyID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  managerID INTEGER NOT NULL,
  FOREIGN KEY (managerID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS applications (
  appID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  categoryID INTEGER,
  companyID INTEGER,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  appliedDate TEXT NOT NULL,     -- ISO date string
  deadline TEXT,
  notes TEXT,
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (categoryID) REFERENCES categories(categoryID),
  FOREIGN KEY (companyID) REFERENCES companies(companyID)
);

CREATE TABLE IF NOT EXISTS application_history (
  historyID INTEGER PRIMARY KEY AUTOINCREMENT,
  appID INTEGER NOT NULL,
  statusChange TEXT NOT NULL,
  feedback TEXT,
  updateDate TEXT NOT NULL,
  FOREIGN KEY (appID) REFERENCES applications(appID)
);

CREATE TABLE IF NOT EXISTS reminders (
  reminderID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  appID INTEGER,
  message TEXT NOT NULL,
  reminderDate TEXT NOT NULL,
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (appID) REFERENCES applications(appID)
);

CREATE TABLE IF NOT EXISTS audit_log (
  logID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (userID) REFERENCES users(userID)
);

