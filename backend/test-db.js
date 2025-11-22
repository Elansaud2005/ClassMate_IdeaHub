const pool = require("./db");

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result;");
    console.log("DB Connected! Test result =", rows[0].result);
  } catch (err) {
    console.error("DB Connection ERROR:", err);
  }
}

testConnection();
