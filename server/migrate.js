const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data/jobtracker.sqlite");

db.run("ALTER TABLE users ADD COLUMN nickname TEXT", (err) => {
    if (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error(err.message);
        }
    } else {
        console.log("Successfully added nickname column to users table.");
    }
});
db.close();
