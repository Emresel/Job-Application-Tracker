const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const DB_PATH = process.env.DB_PATH || "./data/jobtracker.sqlite";

const API_PREFIX = "/api/v1";

function nowIso() {
  return new Date().toISOString();
}

function parseCsvList(s) {
  if (!s) return [];
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function hasRole(user, roles) {
  return user && roles.includes(user.role);
}

function hasType(user, types) {
  if (!user) return false;
  const userTypes = parseCsvList(user.userTypes);
  return types.some((t) => userTypes.includes(t));
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function openDb(dbPath) {
  ensureDirForFile(dbPath);
  return new sqlite3.Database(dbPath);
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDb(db) {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await dbRun(db, "PRAGMA foreign_keys = ON;");
  // sqlite3 doesn't support executing multiple statements in db.run reliably with params.
  // We'll split on semicolons for initialization.
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const stmt of statements) {
    await dbRun(db, stmt);
  }

  // Seed minimal data if empty
  const existing = await dbGet(db, "SELECT COUNT(*) AS c FROM users");
  if (existing && existing.c === 0) {
    const adminPass = await bcrypt.hash("Admin123!", 10);
    const mgmtPass = await bcrypt.hash("Manager123!", 10);
    const userPass = await bcrypt.hash("User123!", 10);

    const admin = await dbRun(
      db,
      `INSERT INTO users (name, username, email, passwordHash, role, userTypes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Admin", "admin", "admin@example.com", adminPass, "Admin", null],
    );
    await dbRun(
      db,
      `INSERT INTO users (name, username, email, passwordHash, role, userTypes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Management", "manager", "manager@example.com", mgmtPass, "Management", null],
    );
    await dbRun(
      db,
      `INSERT INTO users (name, username, email, passwordHash, role, userTypes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Regular User", "user", "user@example.com", userPass, "Regular", "JobSeeker"],
    );

    // Companies
    const c1 = await dbRun(
      db,
      `INSERT INTO companies (name, industry, location) VALUES (?, ?, ?)`,
      ["OpenAI", "AI", "San Francisco"],
    );
    const c2 = await dbRun(
      db,
      `INSERT INTO companies (name, industry, location) VALUES (?, ?, ?)`,
      ["Microsoft", "Tech", "USA"],
    );

    // Categories (managed by admin)
    const cat1 = await dbRun(
      db,
      `INSERT INTO categories (name, description, managerID) VALUES (?, ?, ?)`,
      ["Software", "Software engineering roles", admin.lastID],
    );
    const cat2 = await dbRun(
      db,
      `INSERT INTO categories (name, description, managerID) VALUES (?, ?, ?)`,
      ["Data", "Data / analytics roles", admin.lastID],
    );

    // Applications for regular user
    const app1 = await dbRun(
      db,
      `INSERT INTO applications (userID, categoryID, companyID, company, position, status, priority, appliedDate, deadline, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [3, cat1.lastID, c2.lastID, "Microsoft", "Software Engineer", "Interview", 2, "2025-01-12", "2025-02-01", "Sent via LinkedIn"],
    );
    await dbRun(
      db,
      `INSERT INTO application_history (appID, statusChange, feedback, updateDate)
       VALUES (?, ?, ?, ?)`,
      [app1.lastID, "Interview", "Phone interview scheduled", "2025-01-22"],
    );
    await dbRun(
      db,
      `INSERT INTO reminders (userID, appID, message, reminderDate) VALUES (?, ?, ?, ?)`,
      [3, app1.lastID, "Prepare for interview", "2025-01-25"],
    );
  }
}

function signToken(user) {
  return jwt.sign(
    {
      userID: user.userID,
      role: user.role,
      userTypes: user.userTypes || null,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function authOptional(req, _res, next) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

function authRequired(req, res, next) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

function requireAnyType(...types) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === "Admin" || req.user.role === "Management") return next();
    const userTypes = parseCsvList(req.user.userTypes);
    if (types.some((t) => userTypes.includes(t))) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}

async function audit(db, userID, action) {
  if (!userID) return;
  await dbRun(db, `INSERT INTO audit_log (userID, action, timestamp) VALUES (?, ?, ?)`, [
    userID,
    action,
    nowIso(),
  ]);
}

function toInt(x, fallback = null) {
  const n = Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function escapeCsvValue(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const db = openDb(DB_PATH);
  await initDb(db);

  const app = express();
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  // Optional auth for guest preview endpoints
  app.use(API_PREFIX, authOptional);

  // Health
  app.get(`${API_PREFIX}/health`, (_req, res) => res.json({ ok: true, time: nowIso() }));

  // AUTH
  app.post(`${API_PREFIX}/auth/register`, async (req, res) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
      const existing = await dbGet(db, `SELECT userID FROM users WHERE email = ?`, [email]);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const passwordHash = await bcrypt.hash(String(password), 10);
      const r = await dbRun(
        db,
        `INSERT INTO users (name, username, email, passwordHash, role, userTypes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [String(name), null, String(email), passwordHash, "Regular", "JobSeeker"],
      );
      await audit(db, r.lastID, `register:${email}`);
      return res.status(201).json({ userID: r.lastID });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post(`${API_PREFIX}/auth/login`, async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Missing fields" });
      const user = await dbGet(db, `SELECT * FROM users WHERE email = ?`, [String(email)]);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await bcrypt.compare(String(password), user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const token = signToken(user);
      await audit(db, user.userID, "login");
      return res.json({ token });
    } catch {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // USERS
  app.get(`${API_PREFIX}/users/me`, authRequired, async (req, res) => {
    const user = await dbGet(
      db,
      `SELECT userID, name, email, role, userTypes FROM users WHERE userID = ?`,
      [req.user.userID],
    );
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json(user);
  });

  // ADMIN: user management
  app.get(`${API_PREFIX}/users`, authRequired, requireRoles("Admin"), async (_req, res) => {
    const rows = await dbAll(
      db,
      `SELECT userID, name, email, role, userTypes
       FROM users
       ORDER BY userID ASC`,
    );
    return res.json(rows);
  });

  app.put(`${API_PREFIX}/users/:id`, authRequired, requireRoles("Admin"), async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await dbGet(db, `SELECT userID FROM users WHERE userID = ?`, [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const { role, userTypes } = req.body || {};
    const allowedRoles = ["Admin", "Management", "Regular", "Control"];
    if (!role || !allowedRoles.includes(String(role))) return res.status(400).json({ error: "Invalid role" });

    await dbRun(db, `UPDATE users SET role = ?, userTypes = ? WHERE userID = ?`, [
      String(role),
      userTypes !== undefined && userTypes !== null ? String(userTypes) : null,
      id,
    ]);
    await audit(db, req.user.userID, `user:update:${id}:role=${role}:types=${userTypes ?? ""}`);
    return res.json({ ok: true });
  });

  // COMPANIES
  app.get(`${API_PREFIX}/companies`, async (_req, res) => {
    const rows = await dbAll(db, `SELECT companyID, name, industry, location FROM companies ORDER BY name ASC`);
    return res.json(rows);
  });

  app.post(`${API_PREFIX}/companies`, authRequired, async (req, res) => {
    if (!hasRole(req.user, ["Admin", "Management"])) return res.status(403).json({ error: "Forbidden" });
    const { name, industry, location } = req.body || {};
    if (!name) return res.status(400).json({ error: "Missing fields" });
    const r = await dbRun(
      db,
      `INSERT INTO companies (name, industry, location) VALUES (?, ?, ?)`,
      [String(name), industry ? String(industry) : null, location ? String(location) : null],
    );
    await audit(db, req.user.userID, `company:create:${r.lastID}`);
    return res.status(201).json({ companyID: r.lastID });
  });

  // CATEGORIES
  app.get(`${API_PREFIX}/categories`, authOptional, async (_req, res) => {
    const rows = await dbAll(
      db,
      `SELECT c.categoryID, c.name, c.description, c.managerID, u.name as managerName
       FROM categories c
       JOIN users u ON u.userID = c.managerID
       ORDER BY c.name ASC`,
    );
    return res.json(rows);
  });

  app.post(`${API_PREFIX}/categories`, authRequired, requireRoles("Admin", "Management"), async (req, res) => {
    const { name, description, managerID } = req.body || {};
    if (!name || !managerID) return res.status(400).json({ error: "Missing fields" });
    const mgr = await dbGet(db, `SELECT userID FROM users WHERE userID = ?`, [toInt(managerID)]);
    if (!mgr) return res.status(400).json({ error: "Invalid managerID" });
    const r = await dbRun(
      db,
      `INSERT INTO categories (name, description, managerID) VALUES (?, ?, ?)`,
      [String(name), description ? String(description) : null, toInt(managerID)],
    );
    await audit(db, req.user.userID, `category:create:${r.lastID}`);
    return res.status(201).json({ categoryID: r.lastID });
  });

  app.put(`${API_PREFIX}/categories/:id`, authRequired, requireRoles("Admin", "Management"), async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await dbGet(db, `SELECT categoryID FROM categories WHERE categoryID = ?`, [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const { name, description, managerID } = req.body || {};
    if (!name || !managerID) return res.status(400).json({ error: "Missing fields" });
    const mgr = await dbGet(db, `SELECT userID FROM users WHERE userID = ?`, [toInt(managerID)]);
    if (!mgr) return res.status(400).json({ error: "Invalid managerID" });
    await dbRun(
      db,
      `UPDATE categories SET name = ?, description = ?, managerID = ? WHERE categoryID = ?`,
      [String(name), description ? String(description) : null, toInt(managerID), id],
    );
    await audit(db, req.user.userID, `category:update:${id}`);
    return res.json({ ok: true });
  });

  app.delete(`${API_PREFIX}/categories/:id`, authRequired, requireRoles("Admin", "Management"), async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await dbGet(db, `SELECT categoryID FROM categories WHERE categoryID = ?`, [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });
    await dbRun(db, `DELETE FROM categories WHERE categoryID = ?`, [id]);
    await audit(db, req.user.userID, `category:delete:${id}`);
    return res.json({ ok: true });
  });

  // APPLICATIONS
  app.get(`${API_PREFIX}/applications`, async (req, res) => {
    const user = req.user || null;
    const isAuthed = Boolean(user);

    // Guest preview mode for unauthenticated users
    if (!isAuthed) {
      return res.json([
        {
          appID: 0,
          company: "Sample Company",
          position: "Sample Position",
          status: "Interview",
          appliedDate: "2025-01-12",
          priority: 2,
        },
      ]);
    }

    const page = Math.max(1, toInt(req.query.page, 1));
    const pageSize = Math.min(100, Math.max(1, toInt(req.query.pageSize, 20)));
    const offset = (page - 1) * pageSize;

    const status = req.query.status ? String(req.query.status) : null;
    const companyID = req.query.companyID ? toInt(req.query.companyID) : null;
    const categoryID = req.query.categoryID ? toInt(req.query.categoryID) : null;
    const priority = req.query.priority ? toInt(req.query.priority) : null;
    const q = req.query.q ? String(req.query.q) : null;

    const global = req.query.global === "1" || req.query.global === "true";
    const canSeeAll =
      hasRole(user, ["Admin", "Management"]) || (user.role === "Regular" && hasType(user, ["Analyst"]));

    const where = [];
    const params = [];

    if (!(global && canSeeAll)) {
      where.push("a.userID = ?");
      params.push(user.userID);
    }

    if (status) {
      where.push("a.status = ?");
      params.push(status);
    }
    if (companyID) {
      where.push("a.companyID = ?");
      params.push(companyID);
    }
    if (categoryID) {
      where.push("a.categoryID = ?");
      params.push(categoryID);
    }
    if (Number.isFinite(priority) && priority !== null) {
      where.push("a.priority = ?");
      params.push(priority);
    }
    if (q) {
      where.push("(a.company LIKE ? OR a.position LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const sortRaw = req.query.sort ? String(req.query.sort) : "-appliedDate";
    const sortFields = parseCsvList(sortRaw);
    const allowedSort = new Map([
      ["appliedDate", "a.appliedDate"],
      ["deadline", "a.deadline"],
      ["priority", "a.priority"],
      ["status", "a.status"],
      ["company", "a.company"],
      ["position", "a.position"],
    ]);
    const orderBy = sortFields
      .map((f) => {
        const desc = f.startsWith("-");
        const key = desc ? f.slice(1) : f;
        const col = allowedSort.get(key);
        if (!col) return null;
        return `${col} ${desc ? "DESC" : "ASC"}`;
      })
      .filter(Boolean);
    if (orderBy.length === 0) orderBy.push("a.appliedDate DESC");

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = await dbGet(db, `SELECT COUNT(*) AS c FROM applications a ${whereSql}`, params);
    const rows = await dbAll(
      db,
      `SELECT
        a.appID, a.userID, a.categoryID, a.companyID, a.company, a.position, a.status,
        a.priority, a.appliedDate, a.deadline, a.notes,
        c.name AS categoryName,
        co.name AS companyName
      FROM applications a
      LEFT JOIN categories c ON c.categoryID = a.categoryID
      LEFT JOIN companies co ON co.companyID = a.companyID
      ${whereSql}
      ORDER BY ${orderBy.join(", ")}
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return res.json({
      page,
      pageSize,
      total: totalRow ? totalRow.c : 0,
      items: rows,
    });
  });

  app.post(`${API_PREFIX}/applications`, authRequired, requireAnyType("JobSeeker"), async (req, res) => {
    const { companyID, company, position, status, appliedDate, notes, categoryID, priority, deadline } = req.body || {};
    if ((!companyID && !company) || !position || !status || !appliedDate) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let resolvedCompanyID = companyID ? toInt(companyID) : null;
    let resolvedCompanyName = company ? String(company) : null;
    if (resolvedCompanyID) {
      const c = await dbGet(db, `SELECT name FROM companies WHERE companyID = ?`, [resolvedCompanyID]);
      if (!c) return res.status(400).json({ error: "Invalid companyID" });
      resolvedCompanyName = c.name;
    }
    if (!resolvedCompanyName) return res.status(400).json({ error: "Missing company" });

    const r = await dbRun(
      db,
      `INSERT INTO applications (userID, categoryID, companyID, company, position, status, priority, appliedDate, deadline, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userID,
        categoryID ? toInt(categoryID) : null,
        resolvedCompanyID,
        resolvedCompanyName,
        String(position),
        String(status),
        Number.isFinite(toInt(priority, 0)) ? toInt(priority, 0) : 0,
        String(appliedDate),
        deadline ? String(deadline) : null,
        notes ? String(notes) : null,
      ],
    );
    await dbRun(
      db,
      `INSERT INTO application_history (appID, statusChange, feedback, updateDate) VALUES (?, ?, ?, ?)`,
      [r.lastID, String(status), null, nowIso()],
    );
    await audit(db, req.user.userID, `application:create:${r.lastID}`);
    return res.status(201).json({ appID: r.lastID });
  });

  app.put(`${API_PREFIX}/applications/:id`, authRequired, requireAnyType("JobSeeker"), async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await dbGet(db, `SELECT * FROM applications WHERE appID = ?`, [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const canEdit = existing.userID === req.user.userID || hasRole(req.user, ["Admin", "Management"]);
    if (!canEdit) return res.status(403).json({ error: "Forbidden" });

    const patch = req.body || {};
    const next = {
      companyID: patch.companyID !== undefined ? (patch.companyID ? toInt(patch.companyID) : null) : existing.companyID,
      company: patch.company !== undefined ? (patch.company ? String(patch.company) : null) : existing.company,
      position: patch.position !== undefined ? String(patch.position) : existing.position,
      status: patch.status !== undefined ? String(patch.status) : existing.status,
      appliedDate: patch.appliedDate !== undefined ? String(patch.appliedDate) : existing.appliedDate,
      deadline: patch.deadline !== undefined ? (patch.deadline ? String(patch.deadline) : null) : existing.deadline,
      notes: patch.notes !== undefined ? (patch.notes ? String(patch.notes) : null) : existing.notes,
      categoryID: patch.categoryID !== undefined ? (patch.categoryID ? toInt(patch.categoryID) : null) : existing.categoryID,
      priority:
        patch.priority !== undefined
          ? (Number.isFinite(toInt(patch.priority, 0)) ? toInt(patch.priority, 0) : 0)
          : existing.priority,
    };

    // Resolve company name if companyID provided
    if (next.companyID) {
      const c = await dbGet(db, `SELECT name FROM companies WHERE companyID = ?`, [next.companyID]);
      if (!c) return res.status(400).json({ error: "Invalid companyID" });
      next.company = c.name;
    }
    if (!next.company) return res.status(400).json({ error: "Missing company" });

    await dbRun(
      db,
      `UPDATE applications
       SET categoryID = ?, companyID = ?, company = ?, position = ?, status = ?, priority = ?, appliedDate = ?, deadline = ?, notes = ?
       WHERE appID = ?`,
      [
        next.categoryID,
        next.companyID,
        next.company,
        next.position,
        next.status,
        next.priority,
        next.appliedDate,
        next.deadline,
        next.notes,
        id,
      ],
    );

    if (existing.status !== next.status) {
      await dbRun(
        db,
        `INSERT INTO application_history (appID, statusChange, feedback, updateDate) VALUES (?, ?, ?, ?)`,
        [id, next.status, null, nowIso()],
      );
    }

    await audit(db, req.user.userID, `application:update:${id}`);
    return res.json({ ok: true });
  });

  app.delete(`${API_PREFIX}/applications/:id`, authRequired, requireAnyType("JobSeeker"), async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await dbGet(db, `SELECT * FROM applications WHERE appID = ?`, [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const canDelete = existing.userID === req.user.userID || hasRole(req.user, ["Admin", "Management"]);
    if (!canDelete) return res.status(403).json({ error: "Forbidden" });

    await dbRun(db, `DELETE FROM application_history WHERE appID = ?`, [id]);
    await dbRun(db, `DELETE FROM reminders WHERE appID = ?`, [id]);
    await dbRun(db, `DELETE FROM applications WHERE appID = ?`, [id]);
    await audit(db, req.user.userID, `application:delete:${id}`);
    return res.json({ ok: true });
  });

  app.get(`${API_PREFIX}/applications/export.csv`, authRequired, async (req, res) => {
    const user = req.user;
    const global = req.query.global === "1" || req.query.global === "true";
    const canSeeAll =
      hasRole(user, ["Admin", "Management"]) || (user.role === "Regular" && hasType(user, ["Analyst"]));

    const whereSql = global && canSeeAll ? "" : "WHERE a.userID = ?";
    const params = global && canSeeAll ? [] : [user.userID];
    const rows = await dbAll(
      db,
      `SELECT a.appID, a.company, a.position, a.status, a.priority, a.appliedDate, a.deadline, a.notes
       FROM applications a
       ${whereSql}
       ORDER BY a.appliedDate DESC`,
      params,
    );

    const header = ["appID", "company", "position", "status", "priority", "appliedDate", "deadline", "notes"];
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((k) => escapeCsvValue(r[k])).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="applications.csv"`);
    return res.send(csv);
  });

  // HISTORY
  app.get(`${API_PREFIX}/applications/:id/history`, authRequired, async (req, res) => {
    const id = toInt(req.params.id);
    const appRow = await dbGet(db, `SELECT userID FROM applications WHERE appID = ?`, [id]);
    if (!appRow) return res.status(404).json({ error: "Not found" });
    const canRead = appRow.userID === req.user.userID || hasRole(req.user, ["Admin", "Management"]);
    if (!canRead) return res.status(403).json({ error: "Forbidden" });
    const rows = await dbAll(
      db,
      `SELECT historyID, appID, statusChange, feedback, updateDate
       FROM application_history
       WHERE appID = ?
       ORDER BY updateDate DESC`,
      [id],
    );
    return res.json(rows);
  });

  app.post(`${API_PREFIX}/applications/:id/history`, authRequired, async (req, res) => {
    const id = toInt(req.params.id);
    const appRow = await dbGet(db, `SELECT userID FROM applications WHERE appID = ?`, [id]);
    if (!appRow) return res.status(404).json({ error: "Not found" });
    const canWrite = appRow.userID === req.user.userID || hasRole(req.user, ["Admin", "Management"]);
    if (!canWrite) return res.status(403).json({ error: "Forbidden" });
    const { description, statusChange, feedback } = req.body || {};
    const status = statusChange || description;
    if (!status) return res.status(400).json({ error: "Missing fields" });
    const r = await dbRun(
      db,
      `INSERT INTO application_history (appID, statusChange, feedback, updateDate) VALUES (?, ?, ?, ?)`,
      [id, String(status), feedback ? String(feedback) : null, nowIso()],
    );
    await audit(db, req.user.userID, `history:create:${r.lastID}`);
    return res.status(201).json({ historyID: r.lastID });
  });

  // REMINDERS
  app.get(`${API_PREFIX}/reminders`, authRequired, async (req, res) => {
    const rows = await dbAll(
      db,
      `SELECT reminderID, appID, reminderDate, message
       FROM reminders
       WHERE userID = ?
       ORDER BY reminderDate ASC`,
      [req.user.userID],
    );
    return res.json(rows);
  });

  app.post(`${API_PREFIX}/reminders`, authRequired, async (req, res) => {
    const { appID, reminderDate, message } = req.body || {};
    if (!reminderDate || !message) return res.status(400).json({ error: "Missing fields" });

    if (appID) {
      const appRow = await dbGet(db, `SELECT userID FROM applications WHERE appID = ?`, [toInt(appID)]);
      if (!appRow) return res.status(400).json({ error: "Invalid appID" });
      if (appRow.userID !== req.user.userID && !hasRole(req.user, ["Admin", "Management"])) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const r = await dbRun(
      db,
      `INSERT INTO reminders (userID, appID, message, reminderDate) VALUES (?, ?, ?, ?)`,
      [req.user.userID, appID ? toInt(appID) : null, String(message), String(reminderDate)],
    );
    await audit(db, req.user.userID, `reminder:create:${r.lastID}`);
    return res.status(201).json({ reminderID: r.lastID });
  });

  app.delete(`${API_PREFIX}/reminders/:id`, authRequired, async (req, res) => {
    const id = toInt(req.params.id);
    const row = await dbGet(db, `SELECT reminderID, userID FROM reminders WHERE reminderID = ?`, [id]);
    if (!row) return res.status(404).json({ error: "Not found" });
    if (row.userID !== req.user.userID && !hasRole(req.user, ["Admin", "Management"])) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await dbRun(db, `DELETE FROM reminders WHERE reminderID = ?`, [id]);
    await audit(db, req.user.userID, `reminder:delete:${id}`);
    return res.json({ ok: true });
  });

  // DASHBOARD
  app.get(`${API_PREFIX}/dashboard`, async (req, res) => {
    // Guest preview if unauthenticated
    if (!req.user) {
      return res.json({
        totalApplications: 24,
        interviewsScheduled: 5,
        offersReceived: 2,
        rejections: 10,
        scope: "guest",
      });
    }

    const user = req.user;
    const isGlobal =
      hasRole(user, ["Admin", "Management"]) || (user.role === "Regular" && hasType(user, ["Analyst"]));

    const whereSql = isGlobal ? "" : "WHERE userID = ?";
    const params = isGlobal ? [] : [user.userID];

    const total = await dbGet(db, `SELECT COUNT(*) AS c FROM applications ${whereSql}`, params);
    const interviews = await dbGet(
      db,
      `SELECT COUNT(*) AS c FROM applications ${whereSql}${whereSql ? " AND" : " WHERE"} status = ?`,
      [...params, "Interview"],
    );
    const offers = await dbGet(
      db,
      `SELECT COUNT(*) AS c FROM applications ${whereSql}${whereSql ? " AND" : " WHERE"} status IN (?, ?)`,
      [...params, "Offer", "Accepted"],
    );
    const rejections = await dbGet(
      db,
      `SELECT COUNT(*) AS c FROM applications ${whereSql}${whereSql ? " AND" : " WHERE"} status IN (?, ?)`,
      [...params, "Rejected", "Rejection"],
    );

    return res.json({
      totalApplications: total ? total.c : 0,
      interviewsScheduled: interviews ? interviews.c : 0,
      offersReceived: offers ? offers.c : 0,
      rejections: rejections ? rejections.c : 0,
      scope: isGlobal ? "global" : "user",
    });
  });

  app.get(`${API_PREFIX}/dashboard/status-breakdown`, async (req, res) => {
    // Guest preview
    if (!req.user) {
      return res.json([
        { status: "Applied", count: 12 },
        { status: "Interview", count: 5 },
        { status: "Offer", count: 2 },
        { status: "Rejected", count: 10 },
      ]);
    }

    const user = req.user;
    const isGlobal =
      hasRole(user, ["Admin", "Management"]) || (user.role === "Regular" && hasType(user, ["Analyst"]));

    const whereSql = isGlobal ? "" : "WHERE userID = ?";
    const params = isGlobal ? [] : [user.userID];
    const rows = await dbAll(
      db,
      `SELECT status, COUNT(*) AS count
       FROM applications
       ${whereSql}
       GROUP BY status`,
      params,
    );
    return res.json(rows);
  });

  app.get(`${API_PREFIX}/dashboard/timeseries`, async (req, res) => {
    const from = req.query.from ? String(req.query.from) : "1970-01-01";
    const to = req.query.to ? String(req.query.to) : "2999-12-31";

    // Guest preview: allow charts without login
    if (!req.user) {
      return res.json([
        { date: "2025-01-01", count: 2 },
        { date: "2025-01-02", count: 1 },
        { date: "2025-01-05", count: 3 },
        { date: "2025-01-12", count: 2 },
        { date: "2025-01-20", count: 1 },
      ]);
    }

    const user = req.user;
    const isGlobal =
      hasRole(user, ["Admin", "Management"]) || (user.role === "Regular" && hasType(user, ["Analyst"]));

    const where = ["appliedDate >= ?", "appliedDate <= ?"];
    const params = [from, to];
    if (!isGlobal) {
      where.push("userID = ?");
      params.push(user.userID);
    }
    const rows = await dbAll(
      db,
      `SELECT appliedDate AS date, COUNT(*) AS count
       FROM applications
       WHERE ${where.join(" AND ")}
       GROUP BY appliedDate
       ORDER BY appliedDate ASC`,
      params,
    );
    return res.json(rows);
  });

  // STATIC FRONTEND (SPA) – Angular: client/dist/... ; Vite/React: client/dist
  const clientCandidates = [
    path.join(__dirname, "..", "client", "dist"),
    path.join(__dirname, "..", "client", "dist", "client", "browser"),
    path.join(__dirname, "..", "client", "dist", "client"),
  ];
  const clientDist = clientCandidates.find((p) => fs.existsSync(path.join(p, "index.html")));

  if (clientDist) {
    app.use(
      express.static(clientDist, {
        setHeaders(res, filePath) {
          // Always revalidate HTML so new hashed assets are picked up.
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-store");
          }
        },
      }),
    );
    app.get("*", (req, res) => {
      if (req.path.startsWith(API_PREFIX)) return res.status(404).json({ error: "Not found" });
      return res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const publicDir = path.join(__dirname, "public");
    app.use(express.static(publicDir));
    app.get("*", (req, res) => {
      if (req.path.startsWith(API_PREFIX)) return res.status(404).json({ error: "Not found" });
      return res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(
      `Seeded users: admin@example.com / Admin123!, manager@example.com / Manager123!, user@example.com / User123!`,
    );
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

