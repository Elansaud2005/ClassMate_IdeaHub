// backend/server.js
// Express server for ClassMate Idea Hub

const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const pool = require("./db"); // تأكدي أن db.js في نفس المجلد

const app = express();
const PORT = 3000;

// ============ Middlewares ============

// JSON + form body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Frontend static files (html, css, js)
const frontendPath = path.join(__dirname, "..");
app.use("/", express.static(frontendPath));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "index.html"));
});

// ============ CONTACT API ============

app.post(
  "/api/contact",
  [
    check("firstName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("First name must be 2–30 characters"),

    check("lastName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("Last name must be 2–30 characters"),

    check("gender")
      .notEmpty()
      .withMessage("Please select a valid gender"),

    check("mobile")
      .trim()
      .matches(/^(\+?9665\d{8}|05\d{8})$/)
      .withMessage("Use Saudi format: +9665XXXXXXXX or 05XXXXXXXX"),

    check("dob")
      .trim()
      .notEmpty()
      .withMessage("DOB is required"),

    check("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email"),

    check("language")
      .notEmpty()
      .withMessage("Choose a valid language"),

    check("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Message must be between 10 and 1000 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      gender,
      mobile,
      dob,
      email,
      language,
      message,
    } = req.body;

    try {
      await pool.execute(
        `INSERT INTO contact_messages 
         (first_name, last_name, gender, mobile, dob, email, language, message) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, gender, mobile, dob, email, language, message]
      );

      console.log("New Contact Submission saved:", {
        firstName,
        lastName,
        gender,
        mobile,
        dob,
        email,
        language,
        message,
      });

      return res.json({
        status: "ok",
        msg: "Your message was received successfully ✔",
      });
    } catch (err) {
      console.error("Error inserting contact message:", err);
      return res.status(500).json({
        status: "error",
        msg: "Database error while saving your message.",
      });
    }
  }
);

// ============ PROJECT API ============

// POST /api/project — save team project idea
app.post(
  "/api/project",
  [
    check("teamName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Team name must be 3–50 characters"),

    check("teamSize")
      .isInt({ min: 1, max: 10 })
      .withMessage("Team size must be between 1 and 10"),

    check("repName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Representative name must be 3–50 characters"),

    check("repId")
      .trim()
      .matches(/^\d{7}$/)
      .withMessage("Representative ID must be exactly 7 digits"),

    check("repEmail")
      .trim()
      .isEmail()
      .withMessage("Representative email must be valid"),

    check("courseCode")
      .trim()
      .matches(/^[A-Za-z]{2,}\d{2,}$/)
      .withMessage("Course code must look like CCSW321"),

    check("category")
      .notEmpty()
      .withMessage("Major / track is required"),

    check("projectType")
      .notEmpty()
      .withMessage("Project type is required"),

    check("projectName")
      .trim()
      .isLength({ min: 3, max: 60 })
      .withMessage("Project title must be 3–60 characters"),

    check("projectDesc")
      .trim()
      .isLength({ min: 10, max: 400 })
      .withMessage("Description must be 10–400 characters"),
    // tools + otherMembers are optional
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const {
      teamName,
      teamSize,
      repName,
      repId,
      repEmail,
      otherMembers,
      courseCode,
      category,
      projectType,
      projectName,
      projectDesc,
      tools,
    } = req.body;

    console.log("New Project Submission (raw body):", req.body);

    try {
      await pool.execute(
        `INSERT INTO projects
         (team_name, team_size, rep_name, rep_id, rep_email, other_members,
          course_code, category, project_type, project_name, description, tools)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          teamName,
          teamSize,
          repName,
          repId,
          repEmail,
          otherMembers || "",
          courseCode,
          category,
          projectType,
          projectName,
          projectDesc,
          tools || "",
        ]
      );

      return res.json({
        status: "ok",
        msg: "Team project idea saved successfully ✔",
      });
    } catch (err) {
      console.error("Error inserting project:", err);
      return res.status(500).json({
        status: "error",
        msg: "Database error while saving project.",
      });
    }
  }
);

// GET /api/projects — list all projects
app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         id,
         team_name,
         team_size,
         course_code,
         category,
         project_type,
         project_name,
         rep_name,
         description
       FROM projects
       ORDER BY id DESC`
    );

    return res.json({
      status: "ok",
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    return res.status(500).json({
      status: "error",
      msg: "Database error while loading projects.",
    });
  }
});

// ============ Start server ============

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
