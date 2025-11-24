// app.js
// frontend logic + validation for classmate idea hub (team cm3)

// when the page finishes loading, we try to init each page separately
// if a specific form or section does not exist on the page, its init function just returns
document.addEventListener("DOMContentLoaded", () => {
  initContactForm();   // contact-us page
  initProjectForm();   // submit idea page
  initMyWorkForm();    // my work section (simple demo)
  initProjectsList();  // projects list table
});

/* ======================================================
   small shared helpers
   ====================================================== */

// clear all validation styles and messages for a given form
function clearFormErrors(form, errorBox) {
  // remove red highlight from any row
  form.querySelectorAll(".field-error").forEach((row) => {
    row.classList.remove("field-error");
  });

  // remove small inline error messages under inputs
  form.querySelectorAll(".error-message").forEach((msg) => msg.remove());

  // reset the main error / success box at the top
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.remove("success-msg");
    errorBox.classList.remove("error-box");
  }
}

// show a single field error under a specific input
function showFieldError(input, message) {
  // find the closest wrapper for this field
  const row =
    input.closest(".form-row") ||
    input.closest(".field") ||
    input.parentElement;

  if (!row) return;

  // add red highlight
  row.classList.add("field-error");

  // find or create a <small> element to show the message
  let msgEl = row.querySelector(".error-message");
  if (!msgEl) {
    msgEl = document.createElement("small");
    msgEl.className = "error-message";
    row.appendChild(msgEl);
  }
  msgEl.textContent = message;
}

// make sure each form has a main error box at the top
// this is where we show a list of problems if there are multiple errors
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

// basic check for dates that look like yyyy-mm-dd
// also verifies that the date actually exists on the calendar
function isValidDateYMD(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;

  const year = Number(m[1]);
  const month = Number(m[2]); // 1–12
  const day = Number(m[3]);   // 1–31

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/* ======================================================
   contact form (contact-us page)
   ====================================================== */

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return; // not on contact page

  const errorBox = ensureErrorBox(form, "contactErrors");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(form, errorBox);

    const errors = [];

    // grab all fields by name (same names used in backend)
    const firstName = form.firstName;
    const lastName = form.lastName;
    const genderChecked = form.querySelector('input[name="gender"]:checked');
    const mobile = form.mobile;
    const dob = form.dob;
    const email = form.email;
    const language = form.language;
    const message = form.message;

    // basic pattern: english letters only for names
    const namePattern = /^[A-Za-z]{2,30}$/;

    // quick date format check using helper
    const dobVal = dob.value.trim();
    if (dobVal) {
      if (!isValidDateYMD(dobVal)) {
        errors.push("date of birth must be a valid date in yyyy-mm-dd format.");
        showFieldError(dob, "use yyyy-mm-dd, e.g., 2003-05-17.");
      } else {
        const dobDate = new Date(dobVal);
        const today = new Date();
        if (dobDate > today) {
          errors.push("date of birth cannot be in the future.");
          showFieldError(dob, "date cannot be in the future.");
        }
      }
    }

    // first name check
    const firstVal = firstName.value.trim();
    if (!namePattern.test(firstVal)) {
      errors.push("first name must be 2–30 letters (a–z) only.");
      showFieldError(firstName, "use letters only, 2–30 characters.");
    }

    // last name check
    const lastVal = lastName.value.trim();
    if (!namePattern.test(lastVal)) {
      errors.push("last name must be 2–30 letters (a–z) only.");
      showFieldError(lastName, "use letters only, 2–30 characters.");
    }

    // gender is required radio
    if (!genderChecked) {
      errors.push("please select a gender option.");
      const fieldset = form.querySelector("fieldset");
      if (fieldset) {
        fieldset.classList.add("field-error");
        let msgEl = fieldset.querySelector(".error-message");
        if (!msgEl) {
          msgEl = document.createElement("small");
          msgEl.className = "error-message";
          fieldset.appendChild(msgEl);
        }
        msgEl.textContent = "please choose one option.";
      }
    }

    // saudi mobile format
    const mobileVal = mobile.value.trim();
    const mobilePattern = /^(?:\+9665\d{8}|05\d{8})$/;
    if (!mobilePattern.test(mobileVal)) {
      errors.push(
        "mobile must be a valid saudi number (+9665xxxxxxxx or 05xxxxxxxx)."
      );
      showFieldError(mobile, "use +9665xxxxxxxx or 05xxxxxxxx.");
    }

    // date of birth required and not in future (max = today or from attribute)
    if (!dob.value) {
      errors.push("date of birth is required.");
      showFieldError(dob, "please enter your date of birth.");
    } else {
      const selected = new Date(dob.value);
      // fallback max date if input has no max attribute
      const maxAttr = dob.max || "2025-11-03";
      const maxAllowed = new Date(maxAttr);
      if (selected > maxAllowed) {
        errors.push("date of birth cannot be in the future.");
        showFieldError(dob, "date cannot be after " + maxAttr + ".");
      }
    }

    // email format
    const emailVal = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      errors.push("email is required.");
      showFieldError(email, "please enter your email address.");
    } else if (!emailPattern.test(emailVal)) {
      errors.push("email must be in a valid format (name@example.com).");
      showFieldError(email, "use a valid email like name@example.com.");
    }

    // preferred language (dropdown)
    if (!language.value) {
      errors.push("please choose a preferred language.");
      showFieldError(language, "please select a language.");
    }

    // message length check
    const msgVal = message.value.trim();
    if (msgVal.length < 10 || msgVal.length > 1000) {
      errors.push("message must be between 10 and 1000 characters.");
      showFieldError(message, "write at least 10 characters.");
    }

    // if any errors → show them in a list at the top and stop here
    if (errors.length > 0) {
      errorBox.className = "error-box";
      errorBox.innerHTML = `
        <h2>there are some problems with your form:</h2>
        <ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul>
      `;
      errorBox.focus();
      return;
    }

    // no client-side errors → send data to backend api
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

      // backend may still return validation errors
      if (result.status === "error") {
        alert(
          "please fix the following errors:\n" +
            (result.errors || []).map((e) => "- " + e.msg).join("\n")
        );
        return;
      }

      // success message at the top of the form
      errorBox.className = "success-msg";
      errorBox.textContent =
        result.msg || "your form has been submitted successfully.";
      form.reset();
    } catch (err) {
      console.error("error submitting contact form:", err);
      alert("there was a problem sending your message.");
    }
  });
}

/* ======================================================
   project form (idea.html)
   - collects team info, course info, and project details
   - also collects extra members (name + id) and sends them as one string
   ====================================================== */

function initProjectForm() {
  const form = document.getElementById("projectForm");
  if (!form) return; // not on idea page

  const errorBox = ensureErrorBox(form, "projectErrors");

  // cache main fields from the form
  const teamName = form.teamName;
  const teamSize = form.teamSize;
  const repName = form.repName;
  const repId = form.repId;
  const repEmail = form.repEmail;
  const courseCode = form.courseCode;
  const category = form.category;
  const projectName = form.projectName;
  const projectDesc = form.projectDesc;
  const tools = form.tools;

  const membersContainer = document.getElementById("membersContainer");
  const otherMembersHidden = document.getElementById("otherMembers");

  // small helper to read currently selected project type radio
  function getProjectTypeChecked() {
    return form.querySelector('input[name="projectType"]:checked');
  }

  // render dynamic member name + id fields based on team size
  // example: if team size = 4 → show 3 blocks for the other members
  function renderMemberInputs() {
    if (!membersContainer) return;

    membersContainer.innerHTML = "";

    const size = parseInt(teamSize.value, 10);
    if (Number.isNaN(size) || size <= 1) {
      // solo or only representative → no extra member fields
      if (otherMembersHidden) otherMembersHidden.value = "";
      return;
    }

    const othersCount = size - 1;

    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent =
      `enter full name + student id for each of the ${othersCount} other member(s).`;
    membersContainer.appendChild(hint);

    for (let i = 1; i <= othersCount; i++) {
      const row = document.createElement("div");
      row.className = "form-row";

      // member name label + input
      const nameLabel = document.createElement("label");
      nameLabel.textContent = `member ${i} name`;

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.name = `memberName${i}`;
      nameInput.className = "member-name-input";
      nameInput.placeholder = "full name";

      // member id label + input
      const idLabel = document.createElement("label");
      idLabel.textContent = `member ${i} id`;

      const idInput = document.createElement("input");
      idInput.type = "text";
      idInput.name = `memberId${i}`;
      idInput.className = "member-id-input";
      idInput.placeholder = "e.g., 2310xxx";

      row.appendChild(nameLabel);
      row.appendChild(nameInput);
      row.appendChild(idLabel);
      row.appendChild(idInput);

      membersContainer.appendChild(row);
    }
  }

  // update dynamic member fields whenever team size changes
  if (teamSize) {
    teamSize.addEventListener("change", renderMemberInputs);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(form, errorBox);

    const errors = [];

    // team name basic length check
    if (!teamName.value.trim() || teamName.value.trim().length < 3) {
      errors.push("team name must be at least 3 characters.");
      showFieldError(teamName, "enter a valid team name.");
    }

    // team size (1–5 max for this project)
    const teamSizeVal = parseInt(teamSize.value, 10);
    if (Number.isNaN(teamSizeVal) || teamSizeVal < 1 || teamSizeVal > 5) {
      errors.push("team size must be between 1 and 5.");
      showFieldError(teamSize, "choose a team size between 1 and 5 members.");
    }

    // validate extra member names + ids and build otherMembers string
    let otherMembersStr = "";
    if (!Number.isNaN(teamSizeVal) && teamSizeVal > 1 && membersContainer) {
      const nameInputs =
        membersContainer.querySelectorAll(".member-name-input");
      const idInputs = membersContainer.querySelectorAll(".member-id-input");
      const expected = teamSizeVal - 1;

      if (nameInputs.length !== expected || idInputs.length !== expected) {
        errors.push(
          "please reselect the team size so member fields are generated correctly."
        );
      } else {
        const lines = [];

        for (let i = 0; i < expected; i++) {
          const nameVal = nameInputs[i].value.trim();
          const idVal = idInputs[i].value.trim();

          if (!nameVal) {
            errors.push(`member ${i + 1} name is required.`);
            showFieldError(nameInputs[i], "please enter this member name.");
          }

          if (!idVal) {
            errors.push(`member ${i + 1} id is required.`);
            showFieldError(idInputs[i], "please enter this member id.");
          }

          // build line only if both are filled
          if (nameVal && idVal) {
            // example → "member 1: sara — 2310xxx"
            lines.push(`member ${i + 1}: ${nameVal} — ${idVal}`);
          }
        }

        otherMembersStr = lines.join("\n");
      }
    }

    // representative name
    if (repName.value.trim().length < 3) {
      errors.push("representative name must be at least 3 characters.");
      showFieldError(repName, "enter a valid name.");
    }

    // representative id (7 digits)
    const repIdVal = repId.value.trim();
    if (!/^\d{7}$/.test(repIdVal)) {
      errors.push("representative id must be exactly 7 digits.");
      showFieldError(repId, "use exactly 7 digits.");
    }

    // representative email
    const repEmailVal = repEmail.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(repEmailVal)) {
      errors.push("representative email must be valid.");
      showFieldError(repEmail, "use a valid email like name@uj.edu.sa.");
    }

    // course code like ccsw321 (letters + digits)
    const coursePattern = /^[A-Za-z]{2,}\d{2,}$/;
    const courseVal = courseCode.value.trim();
    if (!coursePattern.test(courseVal)) {
      errors.push("course code must follow a pattern like ccsw321.");
      showFieldError(courseCode, "example: ccsw321 (letters + digits).");
    }

    // project title length
    if (projectName.value.trim().length < 3) {
      errors.push("project title must be at least 3 characters.");
      showFieldError(projectName, "enter a longer title.");
    }

    // major / category (dropdown)
    if (!category.value) {
      errors.push("please select a major / track.");
      showFieldError(category, "select a major.");
    }

    // project type (radio) must be selected
    const projectTypeChecked = getProjectTypeChecked();
    if (!projectTypeChecked) {
      errors.push("please select a project type.");
      const anyProjectType = form.querySelector('input[name="projectType"]');
      if (anyProjectType) {
        const row =
          anyProjectType.closest(".form-row") || anyProjectType.parentElement;
        if (row) {
          row.classList.add("field-error");
          let msgEl = row.querySelector(".error-message");
          if (!msgEl) {
            msgEl = document.createElement("small");
            msgEl.className = "error-message";
            row.appendChild(msgEl);
          }
          msgEl.textContent = "select group or solo.";
        }
      }
    }

    // description length
    const descVal = projectDesc.value.trim();
    if (descVal.length < 10) {
      errors.push("project description must be at least 10 characters.");
      showFieldError(projectDesc, "write a longer description.");
    }

    // tools is optional, so no strict validation here

    // show top-level errors if any
    if (errors.length > 0) {
      errorBox.className = "error-box";
      errorBox.innerHTML = `
        <h2>please review the highlighted fields:</h2>
        <ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul>
      `;
      errorBox.focus();
      return;
    }

    // push final string into hidden input so backend receives it too
    if (otherMembersHidden) {
      otherMembersHidden.value = otherMembersStr;
    }

    // send project data to backend api
    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamName.value.trim(),
          teamSize: teamSize.value,
          repName: repName.value.trim(),
          repId: repId.value.trim(),
          repEmail: repEmail.value.trim(),
          otherMembers: otherMembersStr,
          courseCode: courseCode.value.trim(),
          category: category.value,
          projectType: projectTypeChecked ? projectTypeChecked.value : "",
          projectName: projectName.value.trim(),
          projectDesc: projectDesc.value.trim(),
          tools: tools ? tools.value.trim() : "",
        }),
      });

      const result = await response.json();

      if (result.status === "error") {
        errorBox.className = "error-box";
        errorBox.textContent =
          result.msg || "there was a problem saving your project.";
        return;
      }

      // success case
      errorBox.className = "success-msg";
      errorBox.textContent =
        result.msg || "team project idea has been saved successfully.";
      form.reset();
      if (membersContainer) {
        membersContainer.innerHTML = "";
      }
    } catch (err) {
      console.error("error submitting project form:", err);
      errorBox.className = "error-box";
      errorBox.textContent = "server error while saving your project.";
    }
  });
}

/* ======================================================
   my work form (simple student id demo)
   ====================================================== */

function initMyWorkForm() {
  const form = document.getElementById("myWorkForm");
  if (!form) return; // not on this page

  const errorBox = ensureErrorBox(form, "myWorkErrors");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormErrors(form, errorBox);

    const sidInput = form.sid;
    const sidVal = sidInput.value.trim();
    const errors = [];

    // simple demo: 7 digits only
    if (!sidVal) {
      errors.push("student id is required.");
      showFieldError(sidInput, "please enter your student id.");
    } else if (!/^\d+$/.test(sidVal)) {
      errors.push("student id must contain digits only (0–9).");
      showFieldError(sidInput, "use numbers only (0–9).");
    } else if (sidVal.length !== 7) {
      errors.push("student id must be exactly 7 digits.");
      showFieldError(sidInput, "enter exactly 7 digits.");
    }

    if (errors.length > 0) {
      errorBox.className = "error-box";
      errorBox.innerHTML = `<ul>${errors
        .map((e) => `<li>${e}</li>`)
        .join("")}</ul>`;
      errorBox.focus();
      return;
    }

    // in a real system this would call an api to load tasks by sid
    // here we just show a success message
    errorBox.className = "success-msg";
    errorBox.textContent = "tasks loaded successfully for id: " + sidVal + ".";
  });
}

/* ======================================================
   projects list page (projects.html)
   - loads all projects from backend
   - fills the table body with rows
   - formats other members as small badges
   ====================================================== */

function initProjectsList() {
  const tbody = document.getElementById("projectsBody");
  const statusBox = document.getElementById("projectsStatus");
  if (!tbody || !statusBox) return; // not on projects page

  statusBox.textContent = "loading projects…";

  fetch("/api/projects")
    .then((res) => res.json())
    .then((result) => {
      if (result.status !== "ok") {
        statusBox.textContent = result.msg || "could not load projects.";
        return;
      }

      const projects = result.data;
      if (!projects || projects.length === 0) {
        statusBox.textContent = "no projects found yet.";
        return;
      }

      statusBox.textContent = `loaded ${projects.length} project(s).`;

      let rows = "";

      // build one <tr> for each project returned from the api
      projects.forEach((p) => {
        rows += `
          <tr>
            <td>${p.id}</td>
            <td>${p.team_name}</td>
            <td>${p.rep_name}</td>
            <td>${formatMembers(p.other_members)}</td>
            <td>${p.course_code}</td>
            <td>${formatMajor(p.category)}</td>
            <td>${p.project_type}</td>
            <td>${p.project_name}</td>
            <td>${p.description}</td>
          </tr>
        `;
      });

      tbody.innerHTML = rows;
    })
    .catch((err) => {
      console.error("error loading projects:", err);
      statusBox.textContent = "error loading projects.";
    });
}

// format "other_members" string from db into small badges
function formatMembers(other) {
  if (!other) return "-";

  // split by newline: each line looks like "member 1: sara — 2310xxx"
  const lines = other.split("\n").filter(Boolean);
  if (!lines.length) return "-";

  return lines
    .map((line) => {
      // remove "member 1:" prefix to keep it clean
      const cleaned = line.replace(/^member\s*\d+:\s*/i, "");
      // turn into one badge: "sara — 2310xxx"
      return `<span class="member-badge">${cleaned}</span>`;
    })
    .join(" ");
}

// map internal major codes to readable labels in the table
function formatMajor(code) {
  switch (code) {
    case "cybersecurity":
      return "cybersecurity";
    case "cs":
      return "computer science";
    case "se":
      return "software engineering";
    case "is":
      return "information systems";
    case "ai":
      return "artificial intelligence";
    case "data":
      return "data science";
    default:
      return code || "";
  }
}
