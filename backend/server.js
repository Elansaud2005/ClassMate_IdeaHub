// backend/server.js
// simple express backend for classmate project

const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const pool = require("./db");

const app = express();
const PORT = 3000;

// ------------------------------------------------------
// basic middleware
// ------------------------------------------------------

// parse json bodies (for fetch api)
app.use(express.json());

// parse form data (for normal html forms)
app.use(express.urlencoded({ extended: false }));

// ------------------------------------------------------
// static frontend
// ------------------------------------------------------
// this file is inside "backend/"
// so ".." = project root (where html, css, js, media live)

const frontendDir = path.join(__dirname, "..");

// serve static files like /css, /js, /media, and /html if needed
app.use(express.static(frontendDir));

// ------------------------------------------------------
// html page routes
// ------------------------------------------------------

// home page (root url)
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "index.html"));
});

// explicit route for /index.html (for direct access)
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "index.html"));
});

// about page
app.get("/about-us.html", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "about-us.html"));
});

// contact page
app.get("/contact-us.html", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "contact-us.html"));
});

// projects list page
app.get("/projects.html", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "projects.html"));
});

// submit idea page
app.get("/idea.html", (req, res) => {
  res.sendFile(path.join(frontendDir, "html", "idea.html"));
});

// ------------------------------------------------------
// contact api
// ------------------------------------------------------
// receives data from contact-us form and saves it into db

app.post(
  "/api/contact",
  [
    // basic validation rules for contact fields
    check("firstName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("first name must be 2–30 characters"),

    check("lastName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("last name must be 2–30 characters"),

    check("gender")
      .notEmpty()
      .withMessage("please select a gender"),

    check("mobile")
      .trim()
      .matches(/^(\+?9665\d{8}|05\d{8})$/)
      .withMessage("use saudi format: +9665xxxxxxxx or 05xxxxxxxx"),

    check("dob")
      .trim()
      .notEmpty()
      .withMessage("dob is required"),

    check("email")
      .trim()
      .isEmail()
      .withMessage("enter a valid email"),

    check("language")
      .notEmpty()
      .withMessage("choose at least one language"),

    check("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("message must be between 10 and 1000 characters"),
  ],
  async (req, res) => {
    // check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // frontend expects: status = "error" and errors = []
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    // extract data from body
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
      // insert into contact_messages table
      await pool.execute(
        `insert into contact_messages 
         (first_name, last_name, gender, mobile, dob, email, language, message) 
         values (?, ?, ?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, gender, mobile, dob, email, language, message]
      );

      console.log("new contact message saved");

      return res.json({
        status: "ok",
        msg: "your message was received successfully ✔",
      });
    } catch (err) {
      console.error("error inserting contact message:", err);
      return res.status(500).json({
        status: "error",
        msg: "database error while saving your message.",
      });
    }
  }
);

// ------------------------------------------------------
// project api
// ------------------------------------------------------
// receives one team project idea and saves it into db

app.post(
  "/api/project",
  [
    // basic validation for project form fields
    check("teamName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("team name must be 3–50 characters"),

    check("teamSize")
      .isInt({ min: 1, max: 10 })
      .withMessage("team size must be between 1 and 10"),

    check("repName")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("representative name must be 3–50 characters"),

    check("repId")
      .trim()
      .matches(/^\d{7}$/)
      .withMessage("representative id must be exactly 7 digits"),

    check("repEmail")
      .trim()
      .isEmail()
      .withMessage("representative email must be valid"),

    check("courseCode")
      .trim()
      .matches(/^[A-Za-z]{2,}\d{2,}$/)
      .withMessage("course code must look like ccsw321"),

    check("category")
      .notEmpty()
      .withMessage("major / track is required"),

    check("projectType")
      .notEmpty()
      .withMessage("project type is required"),

    check("projectName")
      .trim()
      .isLength({ min: 3, max: 60 })
      .withMessage("project title must be 3–60 characters"),

    check("projectDesc")
      .trim()
      .isLength({ min: 10, max: 400 })
      .withMessage("description must be 10–400 characters"),
    // tools + otherMembers are optional, so no validation here
  ],
  async (req, res) => {
    // validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    // extract data from body
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

    console.log("new project submission received");

    try {
      // insert into projects table
      await pool.execute(
        `insert into projects
         (team_name, team_size, rep_name, rep_id, rep_email, other_members,
          course_code, category, project_type, project_name, description, tools)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        msg: "team project idea saved successfully ✔",
      });
    } catch (err) {
      console.error("error inserting project:", err);
      return res.status(500).json({
        status: "error",
        msg: "database error while saving project.",
      });
    }
  }
);

// ------------------------------------------------------
// list all projects for projects page
// used by frontend js (initProjectsList) in projects.html
// ------------------------------------------------------

app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `select 
         id,
         team_name,
         team_size,
         other_members,
         course_code,
         category,
         project_type,
         project_name,
         rep_name,
         description,
         tools
       from projects
       order by id desc`
    );

    return res.json({
      status: "ok",
      data: rows,
    });
  } catch (err) {
    console.error("error fetching projects:", err);
    return res.status(500).json({
      status: "error",
      msg: "database error while loading projects.",
    });
  }
});

// ------------------------------------------------------
// start server
// ------------------------------------------------------

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
