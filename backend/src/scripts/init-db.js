import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "../../sql/schema.sql"), "utf-8");
    await pool.query(sql);
    console.log("Schema appliqué avec succès");
    process.exit(0);
  } catch (err) {
    console.error("Erreur init DB:", err);
    process.exit(1);
  }
}

init();
