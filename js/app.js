// app.js
// Frontend logic for ClassMate Idea Hub (Team CM3)

// =========================
// DOM ready
// =========================
document.addEventListener("DOMContentLoaded", () => {
  initContactForm();
  initProjectForm();
  initProjectsList();
});

// =========================
// Helpers
// =========================

function clearFormErrors(form, errorBox) {
  form.querySelectorAll(".field-error").forEach(row => {
    row.classList.remove("field-error");
  });
  form.querySelectorAll(".error-message").forEach(msg => msg.remove());

  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.remove("success-msg");
    errorBox.classList.remove("error-box");
  }
}

function showFieldError(input, message) {
  const row = input.closest(".form-row") || input.closest(".field") || input.parentElement;
  if (!row) return;

  row.classList.add("field-error");

  let msgEl = row.querySelector(".error-message");
  if (!msgEl) {
    msgEl = document.createElement("small");
    msgEl.className = "error-message";
    row.appendChild(msgEl);
  }
  msgEl.textContent = message;
}

function ensureErrorBox(form, boxId) {
  let box = document.getElementById(boxId);
  if (!box) {
    box = document.createElement("div");
    box.id = boxId;
    box.setAttribute("aria-live", "polite");
    box.setAttribute("role", "alert");
    form.prepend(box);
  }
  return box;
}

// validate simple YYYY-MM-DD
function isValidDateYMD(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

// =========================
// CONTACT FORM
// =========================

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const errorBox = ensureErrorBox(form, "contactErrors");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(form, errorBox);

    const errors = [];

    const firstName = form.firstName;
    const lastName = form.lastName;
    const genderChecked = form.querySelector('input[name="gender"]:checked');
    const mobile = form.mobile;
    const dob = form.dob;
    const email = form.email;
    const language = form.language;
    const message = form.message;

    // Names: simple A–Z validation (English)
    const namePattern = /^[A-Za-z]{2,30}$/;

    const firstVal = firstName.value.trim();
    if (!namePattern.test(firstVal)) {
      errors.push("First name must be 2–30 letters (A–Z) only.");
      showFieldError(firstName, "Use letters only, 2–30 characters.");
    }

    const lastVal = lastName.value.trim();
    if (!namePattern.test(lastVal)) {
      errors.push("Last name must be 2–30 letters (A–Z) only.");
      showFieldError(lastName, "Use letters only, 2–30 characters.");
    }

    if (!genderChecked) {
      errors.push("Please select a gender option.");
      const genderFieldset = form.querySelector('fieldset.form-group legend + label')?.closest("fieldset");
      const container = form.querySelector('fieldset.form-group legend:contains("Gender")'); // best effort
      const fieldset = form.querySelector("fieldset.form-group:nth-of-type(2)") || form.querySelector("fieldset.form-group");
      const target = fieldset || form;
      target.classList.add("field-error");
    }

    const mobileVal = mobile.value.trim();
    const mobilePattern = /^(?:\+9665\d{8}|05\d{8})$/;
    if (!mobilePattern.test(mobileVal)) {
      errors.push("Mobile must be a valid Saudi number (+9665XXXXXXXX or 05XXXXXXXX).");
      showFieldError(mobile, "Use +9665XXXXXXXX or 05XXXXXXXX.");
    }

    // DOB
    if (!dob.value) {
      errors.push("Date of birth is required.");
      showFieldError(dob, "Please enter your date of birth.");
    } else {
      const selected = new Date(dob.value);
      const today = new Date();
      if (selected > today) {
        errors.push("Date of birth cannot be in the future.");
        showFieldError(dob, "Date cannot be in the future.");
      }
    }

    // Email
    const emailVal = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      errors.push("Email is required.");
      showFieldError(email, "Please enter your email address.");
    } else if (!emailPattern.test(emailVal)) {
      errors.push("Email must be in a valid format (name@example.com).");
      showFieldError(email, "Use a valid email like name@example.com.");
    }

    if (!language.value) {
      errors.push("Please choose a preferred language.");
      showFieldError(language, "Please select a language.");
    }

    const msgVal = message.value.trim();
    if (msgVal.length < 10 || msgVal.length > 1000) {
      errors.push("Message must be between 10 and 1000 characters.");
      showFieldError(message, "Write at least 10 characters.");
    }

    if (errors.length > 0) {
      errorBox.className = "error-box";
      errorBox.innerHTML = `
        <h2>There are some problems with your form:</h2>
        <ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>
      `;
      errorBox.focus();
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.value.trim(),
          lastName: lastName.value.trim(),
          gender: genderChecked ? genderChecked.value : "",
          mobile: mobile.value.trim(),
          dob: dob.value.trim(),
          email: email.value.trim(),
          language: language.value,
          message: message.value.trim(),
        }),
      });

      const result = await response.json();

      if (result.status === "error") {
        errorBox.className = "error-box";
        errorBox.textContent = result.msg || "There was a problem sending your message.";
        return;
      }

      errorBox.className = "success-msg";
      errorBox.textContent = result.msg || "Your message has been sent successfully.";
      form.reset();

    } catch (err) {
      console.error("Error submitting contact form:", err);
      errorBox.className = "error-box";
      errorBox.textContent = "Server error while sending your message.";
    }
  });
}

// =========================
// PROJECT FORM (Teams)
// =========================

function initProjectForm() {
  const form = document.getElementById("projectForm");
  if (!form) return;

  const errorBox = ensureErrorBox(form, "projectErrors");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(form, errorBox);

    const errors = [];

    const teamName = form.teamName;
    const teamSize = form.teamSize;
    const repName = form.repName;
    const repId = form.repId;
    const repEmail = form.repEmail;
    const otherMembers = form.otherMembers;

    const courseCode = form.courseCode;
    const projectName = form.projectName;
    const category = form.category;
    const projectDesc = form.projectDesc;
    const tools = form.tools;
    const projectTypeChecked = form.querySelector('input[name="projectType"]:checked');

    // Team name
    if (teamName.value.trim().length < 3) {
      errors.push("Team name must be at least 3 characters.");
      showFieldError(teamName, "Enter a longer team name.");
    }

    // Team size
    const teamSizeVal = parseInt(teamSize.value, 10);
    if (Number.isNaN(teamSizeVal) || teamSizeVal < 1 || teamSizeVal > 10) {
      errors.push("Team size must be between 1 and 10.");
      showFieldError(teamSize, "Choose between 1 and 10 members.");
    }

    // Representative name
    if (repName.value.trim().length < 3) {
      errors.push("Representative name must be at least 3 characters.");
      showFieldError(repName, "Enter a valid name.");
    }

    // Representative ID (exactly 7 digits)
    const repIdVal = repId.value.trim();
    if (!/^\d{7}$/.test(repIdVal)) {
      errors.push("Representative ID must be exactly 7 digits.");
      showFieldError(repId, "Use exactly 7 digits.");
    }

    // Representative email
    const repEmailVal = repEmail.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(repEmailVal)) {
      errors.push("Representative email must be valid.");
      showFieldError(repEmail, "Use a valid email like name@uj.edu.sa.");
    }

    // Course code (letters + digits)
    const coursePattern = /^[A-Za-z]{2,}\d{2,}$/;
    const courseVal = courseCode.value.trim();
    if (!coursePattern.test(courseVal)) {
      errors.push("Course code must follow a pattern like CCSW321.");
      showFieldError(courseCode, "Example: CCSW321 (letters + digits).");
    }

    // Project title
    if (projectName.value.trim().length < 3) {
      errors.push("Project title must be at least 3 characters.");
      showFieldError(projectName, "Enter a longer title.");
    }

    // Major / category
    if (!category.value) {
      errors.push("Please select a major / track.");
      showFieldError(category, "Select a major.");
    }

    // Project type
    if (!projectTypeChecked) {
      errors.push("Please select a project type.");
      const row = form.querySelector('input[name="projectType"]').closest(".form-row");
      if (row) {
        row.classList.add("field-error");
        let msgEl = row.querySelector(".error-message");
        if (!msgEl) {
          msgEl = document.createElement("small");
          msgEl.className = "error-message";
          row.appendChild(msgEl);
        }
        msgEl.textContent = "Select group or solo.";
      }
    }

    // Description
    const descVal = projectDesc.value.trim();
    if (descVal.length < 10) {
      errors.push("Project description must be at least 10 characters.");
      showFieldError(projectDesc, "Write a longer description.");
    }

    // Tools: optional, no strict validation

    if (errors.length > 0) {
      errorBox.className = "error-box";
      errorBox.innerHTML = `
        <h2>Please review the highlighted fields:</h2>
        <ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>
      `;
      errorBox.focus();
      return;
    }

    // Send to backend
    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamName.value.trim(),
          teamSize: teamSizeVal,
          repName: repName.value.trim(),
          repId: repIdVal,
          repEmail: repEmailVal,
          otherMembers: otherMembers.value.trim(),
          courseCode: courseVal,
          category: category.value,
          projectType: projectTypeChecked ? projectTypeChecked.value : "",
          projectName: projectName.value.trim(),
          projectDesc: descVal,
          tools: tools.value.trim(),
        }),
      });

      const result = await response.json();

      if (result.status === "error") {
        errorBox.className = "error-box";
        errorBox.textContent = result.msg || "There was a problem saving your project.";
        return;
      }

      errorBox.className = "success-msg";
      errorBox.textContent = result.msg || "Team project idea has been saved successfully.";
      form.reset();

    } catch (err) {
      console.error("Error submitting project form:", err);
      errorBox.className = "error-box";
      errorBox.textContent = "Server error while saving your project.";
    }
  });
}

// =========================
// PROJECTS LIST PAGE
// =========================

function initProjectsList() {
  const tbody = document.getElementById("projectsBody");
  const statusBox = document.getElementById("projectsStatus");
  if (!tbody || !statusBox) return; // not on projects page

  statusBox.textContent = "Loading projects…";

  fetch("/api/projects")
    .then(res => res.json())
    .then(result => {
      if (result.status !== "ok") {
        statusBox.textContent = result.msg || "Could not load projects.";
        return;
      }

      const projects = result.data;
      if (!projects || projects.length === 0) {
        statusBox.textContent = "No projects found yet.";
        return;
      }

      statusBox.textContent = `Loaded ${projects.length} project(s).`;

      projects.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.team_name}</td>
          <td>${p.team_size}</td>
          <td>${p.course_code}</td>
          <td>${formatMajor(p.category)}</td>
          <td>${p.project_type}</td>
          <td>${p.project_name}</td>
          <td>${p.rep_name}</td>
          <td>${p.description}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Error loading projects:", err);
      statusBox.textContent = "Error loading projects.";
    });
}

function formatMajor(code) {
  switch (code) {
    case "cybersecurity": return "Cybersecurity";
    case "cs": return "Computer Science";
    case "se": return "Software Engineering";
    case "is": return "Information Systems";
    case "ai": return "Artificial Intelligence";
    case "data": return "Data Science";
    default: return code || "";
  }
}
