/* Frontend-only schedule generator that mirrors the C++ greedy scheduler:
   - First-Fit Decreasing by student count
   - Shift capacity in seats
   - Gap constraint: conflict if |day - usedDay| <= gapDays
   - Room allocations with roll ranges
*/

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

function clampInt(v, { min = -Infinity, max = Infinity } = {}) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function sanitizeCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function sanitizeName(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
}

function pad3(n) {
  const s = String(n);
  if (s.length >= 3) return s;
  return "0".repeat(3 - s.length) + s;
}

function formatTimeSlot(startHour24, durationHours) {
  const endHour24 = startHour24 + durationHours;
  const startHour12 = ((startHour24 % 12) + 12) % 12 || 12;
  const endHour12 = ((endHour24 % 12) + 12) % 12 || 12;

  const startAmPm = startHour24 >= 12 && startHour24 < 24 ? "PM" : "AM";
  const endAmPm = endHour24 >= 12 && endHour24 < 24 ? "PM" : "AM";

  const startStr = `${startHour12 < 10 ? "0" : ""}${startHour12}:00 ${startAmPm}`;
  const endStr = `${endHour12 < 10 ? "0" : ""}${endHour12}:00 ${endAmPm}`;
  return `${startStr} - ${endStr}`;
}

function makeShiftTemplates(examLengthHours, shiftsPerDay) {
  const templates = [];
  if (shiftsPerDay >= 1) templates.push({ timeName: "Morning", startHour24: 8 });
  if (shiftsPerDay >= 2) templates.push({ timeName: "Afternoon", startHour24: 12 });
  if (shiftsPerDay >= 3) templates.push({ timeName: "Evening", startHour24: 16 });
  return templates.map((t) => ({
    timeName: t.timeName,
    timeSlot: formatTimeSlot(t.startHour24, examLengthHours),
  }));
}

function addNewDay(shifts, { maxCapacity, shiftTemplates }) {
  const nextDay = Math.floor(shifts.length / shiftTemplates.length) + 1;
  for (const t of shiftTemplates) {
    shifts.push({
      day: nextDay,
      shiftName: t.timeName,
      timeSlot: t.timeSlot,
      remainingCapacity: maxCapacity,
    });
  }
}

function allocateRooms(students, deptCode, roomCapacities) {
  const allocations = [];
  let studentsToAssign = students;
  let currentRoll = 1;
  let currentRoomIdx = 0;

  while (studentsToAssign > 0) {
    if (currentRoomIdx >= roomCapacities.length) {
      // Not enough classrooms to seat this department in one shift
      return { ok: false, allocations: [], reason: "Not enough classroom seats/rooms to allocate this exam." };
    }

    const room = roomCapacities[currentRoomIdx];
    const inRoom = Math.min(studentsToAssign, room.seats);
    const rollRange = `${deptCode}-${pad3(currentRoll)} to ${deptCode}-${pad3(
      currentRoll + inRoom - 1
    )}`;
    allocations.push({ roomLabel: room.name || `Room ${currentRoomIdx + 1}`, rollRange });
    currentRoll += inRoom;
    studentsToAssign -= inRoom;
    currentRoomIdx += 1;
  }
  return { ok: true, allocations };
}

function generateSchedule({ departments, roomCapacities, shiftsPerDay, examLengthHours, gapDays }) {
  const issues = [];

  if (!Array.isArray(roomCapacities) || roomCapacities.length === 0) {
    issues.push("Add at least one classroom with seats.");
  }

  const cleanedRooms = [];
  for (const [idx, r] of (roomCapacities ?? []).entries()) {
    const name = sanitizeName(r.name || `Room ${idx + 1}`);
    const seats = clampInt(r.seats, { min: 1 });
    if (seats == null) issues.push(`Classroom #${idx + 1}: seats must be a positive integer.`);
    cleanedRooms.push({ name, seats });
  }

  const totalSeats = cleanedRooms.reduce((sum, r) => sum + (r.seats ?? 0), 0);
  if (!Number.isFinite(totalSeats) || totalSeats <= 0) issues.push("Total seats per shift must be > 0 (sum of classroom seats).");

  if (![1, 2, 3].includes(shiftsPerDay)) issues.push("Shifts per day must be 1, 2, or 3.");
  if (!Number.isFinite(examLengthHours) || examLengthHours <= 0) issues.push("Exam duration must be a positive number of hours.");
  if (!Number.isFinite(gapDays) || gapDays < 0) issues.push("Gap days must be 0 or more.");

  if (!Array.isArray(departments) || departments.length === 0) issues.push("Add at least one department.");

  const cleanedDepts = [];
  const seenCodes = new Set();

  for (const [idx, d] of (departments ?? []).entries()) {
    const name = sanitizeName(d.name);
    const code = sanitizeCode(d.code);
    const students = clampInt(d.students, { min: 1 });
    const exams = clampInt(d.exams, { min: 1 });

    if (!name) issues.push(`Department #${idx + 1}: name is required.`);
    if (!code) issues.push(`Department #${idx + 1}: code is required (letters/numbers).`);
    if (code && seenCodes.has(code)) issues.push(`Department code "${code}" is duplicated. Codes must be unique.`);
    if (students == null) issues.push(`Department #${idx + 1}: students must be a positive integer.`);
    if (exams == null) issues.push(`Department #${idx + 1}: exams must be a positive integer.`);
    if (students != null && Number.isFinite(totalSeats) && students > totalSeats) {
      issues.push(`Department "${name || code || `#${idx + 1}`}": students (${students}) exceed total seats per shift (${totalSeats}). Increase capacity.`);
    }

    if (code) seenCodes.add(code);
    cleanedDepts.push({ name, code, students, exams });
  }

  if (issues.length) return { ok: false, issues };

  // First-Fit Decreasing by students
  cleanedDepts.sort((a, b) => b.students - a.students);

  const shiftTemplates = makeShiftTemplates(examLengthHours, shiftsPerDay);
  const shifts = [];
  addNewDay(shifts, { maxCapacity: totalSeats, shiftTemplates });

  const schedule = [];

  for (const dept of cleanedDepts) {
    const usedDays = [];
    for (let examNum = 1; examNum <= dept.exams; examNum += 1) {
      let scheduled = false;
      while (!scheduled) {
        for (const shift of shifts) {
          let conflict = false;
          for (const usedDay of usedDays) {
            if (Math.abs(shift.day - usedDay) <= gapDays) {
              conflict = true;
              break;
            }
          }

          if (!conflict && shift.remainingCapacity >= dept.students) {
            shift.remainingCapacity -= dept.students;
            usedDays.push(shift.day);
            const roomAlloc = allocateRooms(dept.students, dept.code, cleanedRooms);
            if (!roomAlloc.ok) {
              return { ok: false, issues: [`Department "${dept.name}": ${roomAlloc.reason}`] };
            }
            schedule.push({
              deptName: dept.name,
              deptCode: dept.code,
              examNum,
              day: shift.day,
              shiftName: shift.shiftName,
              timeSlot: shift.timeSlot,
              rooms: roomAlloc.allocations,
            });
            scheduled = true;
            break;
          }
        }

        if (!scheduled) {
          addNewDay(shifts, { maxCapacity: totalSeats, shiftTemplates });
        }
      }
    }
  }

  return { ok: true, schedule, meta: { totalSeats, rooms: cleanedRooms.length, shiftsPerDay, examLengthHours, gapDays } };
}

function scheduleToCsv(schedule) {
  const header = "Department,Exam Number,Day,Shift,Time Slot,Room,Roll Numbers";
  const lines = [header];

  for (const entry of schedule) {
    for (const room of entry.rooms) {
      lines.push(
        [
          escapeCsv(entry.deptName),
          escapeCsv(entry.examNum),
          escapeCsv(entry.day),
          escapeCsv(entry.shiftName),
          escapeCsv(entry.timeSlot),
          escapeCsv(room.roomLabel),
          escapeCsv(room.rollRange),
        ].join(",")
      );
    }
  }
  return lines.join("\n") + "\n";
}

function escapeCsv(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderIssues(list) {
  const issuesEl = $("issues");
  if (!list?.length) {
    issuesEl.hidden = true;
    issuesEl.innerHTML = "";
    return;
  }
  issuesEl.hidden = false;
  issuesEl.innerHTML = `
    <div class="issues-title">Fix these before generating:</div>
    <ul>${list.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function groupByDept(schedule) {
  const map = new Map();
  for (const entry of schedule) {
    if (!map.has(entry.deptName)) map.set(entry.deptName, []);
    map.get(entry.deptName).push(entry);
  }
  for (const [k, v] of map.entries()) v.sort((a, b) => a.examNum - b.examNum);
  return [...map.entries()].map(([deptName, entries]) => ({ deptName, entries }));
}

function groupByDay(schedule) {
  const list = [...schedule].sort((a, b) => (a.day - b.day) || a.shiftName.localeCompare(b.shiftName));
  const map = new Map();
  for (const entry of list) {
    const key = `Day ${entry.day}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  }
  return [...map.entries()].map(([dayLabel, entries]) => ({ dayLabel, entries }));
}

function renderResults({ schedule, meta }) {
  $("resultsCard").hidden = false;

  const byDeptPane = document.querySelector('[data-pane="byDept"]');
  const byDayPane = document.querySelector('[data-pane="byDay"]');
  const byRoomPane = document.querySelector('[data-pane="byRoom"]');

  const kv = `
    <div class="kv">
      <span class="pill"><b>Seats/shift</b> ${escapeHtml(meta.totalSeats)}</span>
      <span class="pill"><b>Classrooms</b> ${escapeHtml(meta.rooms)}</span>
      <span class="pill"><b>Shifts/day</b> ${escapeHtml(meta.shiftsPerDay)}</span>
      <span class="pill"><b>Duration</b> ${escapeHtml(meta.examLengthHours)}h</span>
      <span class="pill"><b>Gap</b> ${escapeHtml(meta.gapDays)} day(s)</span>
      <span class="pill"><b>Assignments</b> ${escapeHtml(schedule.length)}</span>
    </div>
  `;

  const deptGroups = groupByDept(schedule);
  byDeptPane.innerHTML =
    kv +
    deptGroups
      .map(({ deptName, entries }) => {
        const rows = entries
          .map(
            (e) =>
              `<tr>
                <td>${escapeHtml(e.examNum)}</td>
                <td>Day ${escapeHtml(e.day)}</td>
                <td>${escapeHtml(e.shiftName)}</td>
                <td><code>${escapeHtml(e.timeSlot)}</code></td>
              </tr>`
          )
          .join("");
        return `
          <div style="margin-bottom: 14px;">
            <div class="pill" style="margin-bottom: 8px;"><b>${escapeHtml(deptName)}</b> (${escapeHtml(entries.length)} exam(s))</div>
            <div class="table-wrap">
              <table class="table" style="min-width: 540px;">
                <thead><tr><th>Exam</th><th>Day</th><th>Shift</th><th>Time slot</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        `;
      })
      .join("");

  const dayGroups = groupByDay(schedule);
  byDayPane.innerHTML =
    kv +
    dayGroups
      .map(({ dayLabel, entries }) => {
        const rows = entries
          .map(
            (e) =>
              `<tr>
                <td>${escapeHtml(e.shiftName)}</td>
                <td><code>${escapeHtml(e.timeSlot)}</code></td>
                <td>${escapeHtml(e.deptName)}</td>
                <td>${escapeHtml(e.examNum)}</td>
              </tr>`
          )
          .join("");
        return `
          <div style="margin-bottom: 14px;">
            <div class="pill" style="margin-bottom: 8px;"><b>${escapeHtml(dayLabel)}</b> (${escapeHtml(entries.length)} assignment(s))</div>
            <div class="table-wrap">
              <table class="table" style="min-width: 640px;">
                <thead><tr><th>Shift</th><th>Time slot</th><th>Department</th><th>Exam</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        `;
      })
      .join("");

  byRoomPane.innerHTML =
    kv +
    schedule
      .map((e) => {
        const rows = e.rooms
          .map(
            (r) =>
              `<tr>
                <td>${escapeHtml(r.roomLabel)}</td>
                <td><code>${escapeHtml(r.rollRange)}</code></td>
              </tr>`
          )
          .join("");
        return `
          <div style="margin-bottom: 14px;">
            <div class="pill" style="margin-bottom: 8px;">
              <b>${escapeHtml(e.deptName)}</b> — Exam ${escapeHtml(e.examNum)} — Day ${escapeHtml(e.day)} ${escapeHtml(e.shiftName)}
            </div>
            <div class="table-wrap">
              <table class="table" style="min-width: 640px;">
                <thead><tr><th>Room</th><th>Roll numbers</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        `;
      })
      .join("");

  const csv = scheduleToCsv(schedule);
  $("csvText").value = csv;

  return csv;
}

function makeDeptRow(dept, idx) {
  const tr = document.createElement("tr");
  tr.dataset.idx = String(idx);

  tr.innerHTML = `
    <td><input type="text" placeholder="e.g., Computer Science" value="${escapeHtml(dept.name ?? "")}" data-k="name" /></td>
    <td><input type="text" placeholder="e.g., CSE" value="${escapeHtml(dept.code ?? "")}" data-k="code" /></td>
    <td><input type="number" min="1" step="1" placeholder="e.g., 600" value="${escapeHtml(dept.students ?? "")}" data-k="students" /></td>
    <td><input type="number" min="1" step="1" placeholder="e.g., 3" value="${escapeHtml(dept.exams ?? "")}" data-k="exams" /></td>
    <td class="cell-actions">
      <button class="btn mini mini-danger" type="button" data-action="remove">Remove</button>
    </td>
  `;
  return tr;
}

function readDepartmentsFromTable() {
  const rows = [...$("deptTbody").querySelectorAll("tr")];
  return rows.map((tr) => {
    const inputs = [...tr.querySelectorAll("input[data-k]")];
    const obj = {};
    for (const inp of inputs) obj[inp.dataset.k] = inp.value;
    return obj;
  });
}

function setDepartmentsTable(depts) {
  const tbody = $("deptTbody");
  tbody.innerHTML = "";
  (depts ?? []).forEach((d, idx) => tbody.appendChild(makeDeptRow(d, idx)));
}

function makeClassroomRow(room, idx) {
  const tr = document.createElement("tr");
  tr.dataset.idx = String(idx);
  tr.innerHTML = `
    <td><input type="text" placeholder="e.g., Room 101" value="${escapeHtml(room.name ?? "")}" data-k="name" /></td>
    <td>
      <div style="display:flex; gap:10px; align-items:center;">
        <input style="flex:1;" type="number" min="1" step="1" placeholder="e.g., 50" value="${escapeHtml(room.seats ?? "")}" data-k="seats" />
        <button class="btn mini mini-danger" type="button" data-action="remove-classroom">Remove</button>
      </div>
    </td>
  `;
  return tr;
}

function setClassroomsTable(rooms) {
  const tbody = $("classroomTbody");
  tbody.innerHTML = "";
  (rooms ?? []).forEach((r, idx) => tbody.appendChild(makeClassroomRow(r, idx)));
  recalcTotalSeats();
}

function readClassroomsFromTable() {
  const rows = [...$("classroomTbody").querySelectorAll("tr")];
  return rows.map((tr, idx) => {
    const inputs = [...tr.querySelectorAll("input[data-k]")];
    const obj = { name: "", seats: "" };
    for (const inp of inputs) obj[inp.dataset.k] = inp.value;
    if (!obj.name) obj.name = `Room ${idx + 1}`;
    return obj;
  });
}

function persistForm() {
  const payload = {
    totalSeats: $("totalSeats").value,
    shiftsPerDay: $("shiftsPerDay").value,
    examLengthHours: $("examLengthHours").value,
    gapDays: $("gapDays").value,
    classrooms: readClassroomsFromTable(),
    departments: readDepartmentsFromTable(),
  };
  localStorage.setItem("optiSchedule.frontend.v1", JSON.stringify(payload));
}

function restoreForm() {
  const raw = localStorage.getItem("optiSchedule.frontend.v1");
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    if (payload.totalSeats != null) $("totalSeats").value = payload.totalSeats;
    if (payload.shiftsPerDay != null) $("shiftsPerDay").value = payload.shiftsPerDay;
    if (payload.examLengthHours != null) $("examLengthHours").value = payload.examLengthHours;
    if (payload.gapDays != null) $("gapDays").value = payload.gapDays;
    if (Array.isArray(payload.classrooms)) setClassroomsTable(payload.classrooms);
    if (Array.isArray(payload.departments)) setDepartmentsTable(payload.departments);
    return true;
  } catch {
    return false;
  }
}

function loadSample() {
  setClassroomsTable([
    { name: "Room 1", seats: 50 },
    { name: "Room 2", seats: 50 },
    { name: "Room 3", seats: 50 },
    { name: "Room 4", seats: 50 },
    { name: "Room 5", seats: 50 },
    { name: "Room 6", seats: 50 },
    { name: "Room 7", seats: 50 },
    { name: "Room 8", seats: 50 },
    { name: "Room 9", seats: 50 },
    { name: "Room 10", seats: 50 },
    { name: "Room 11", seats: 50 },
    { name: "Room 12", seats: 50 },
  ]);
  $("shiftsPerDay").value = "2";
  $("examLengthHours").value = "3";
  $("gapDays").value = "1";
  setDepartmentsTable([
    { name: "Computer Science", code: "CS", students: 600, exams: 3 },
    { name: "Mechanical", code: "ME", students: 500, exams: 3 },
    { name: "Civil", code: "CV", students: 400, exams: 4 },
  ]);
}

function setActiveTab(tabName) {
  const tabs = [...document.querySelectorAll(".tab")];
  const panes = [...document.querySelectorAll(".tabpane")];
  for (const t of tabs) {
    const active = t.dataset.tab === tabName;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  }
  for (const p of panes) {
    p.hidden = p.dataset.pane !== tabName;
  }
}

let lastCsv = "";
let lastSchedule = null;
let lastMeta = null;

function recalcTotalSeats() {
  const rooms = readClassroomsFromTable();
  let sum = 0;
  for (const r of rooms) {
    const seats = clampInt(r.seats, { min: 1 });
    if (seats != null) sum += seats;
  }
  $("totalSeats").value = String(sum);
}

function wireEvents() {
  $("classroomTbody").addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "remove-classroom") {
      btn.closest("tr")?.remove();
      recalcTotalSeats();
      persistForm();
    }
  });

  $("btnAddClassroom").addEventListener("click", () => {
    const current = readClassroomsFromTable();
    current.push({ name: `Room ${current.length + 1}`, seats: 50 });
    setClassroomsTable(current);
    persistForm();
  });

  $("deptTbody").addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "remove") {
      btn.closest("tr")?.remove();
      persistForm();
    }
  });

  $("btnAddDept").addEventListener("click", () => {
    const current = readDepartmentsFromTable();
    current.push({ name: "", code: "", students: "", exams: "" });
    setDepartmentsTable(current);
    persistForm();
  });

  $("btnGenerate").addEventListener("click", () => {
    recalcTotalSeats();
    persistForm();
    const departments = readDepartmentsFromTable();
    const roomCapacities = readClassroomsFromTable();
    const shiftsPerDay = clampInt($("shiftsPerDay").value, { min: 1, max: 3 });
    const examLengthHours = clampInt($("examLengthHours").value, { min: 1, max: 12 });
    const gapDays = clampInt($("gapDays").value, { min: 0 });

    const result = generateSchedule({
      departments,
      roomCapacities,
      shiftsPerDay,
      examLengthHours,
      gapDays,
    });

    if (!result.ok) {
      lastCsv = "";
      lastSchedule = null;
      lastMeta = null;
      $("resultsCard").hidden = true;
      renderIssues(result.issues);
      return;
    }

    renderIssues([]);
    lastSchedule = result.schedule;
    lastMeta = result.meta;
    lastCsv = renderResults({ schedule: result.schedule, meta: result.meta });
    setActiveTab("byDept");
  });

  $("btnExportCsv").addEventListener("click", () => {
    if (!lastCsv) return;
    downloadText("ExamSchedule.csv", lastCsv);
  });

  $("btnCopyCsv").addEventListener("click", async () => {
    if (!lastCsv) return;
    try {
      await navigator.clipboard.writeText(lastCsv);
      $("btnCopyCsv").textContent = "Copied";
      setTimeout(() => ($("btnCopyCsv").textContent = "Copy CSV"), 900);
    } catch {
      // Fallback: focus the textarea for manual copy
      setActiveTab("rawCsv");
      $("csvText").focus();
      $("csvText").select();
    }
  });

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const btn = e.target?.closest?.(".tab");
    if (!btn) return;
    setActiveTab(btn.dataset.tab);
  });

  // persist on input changes
  document.addEventListener(
    "input",
    (e) => {
      if (e.target?.matches?.("input, select, textarea")) {
        if (e.target.closest?.("#classroomTbody")) recalcTotalSeats();
        persistForm();
      }
    },
    { passive: true }
  );

  $("btnLoadSample").addEventListener("click", () => {
    loadSample();
    persistForm();
  });

  $("btnReset").addEventListener("click", () => {
    localStorage.removeItem("optiSchedule.frontend.v1");
    $("resultsCard").hidden = true;
    renderIssues([]);
    setDepartmentsTable([]);
    setClassroomsTable([]);
    $("totalSeats").value = "0";
    $("shiftsPerDay").value = "2";
    $("examLengthHours").value = "3";
    $("gapDays").value = "1";
  });

  const dlg = $("aboutDialog");
  $("btnAbout").addEventListener("click", (e) => {
    e.preventDefault();
    dlg.showModal();
  });
}

function init() {
  const restored = restoreForm();
  if (!restored) {
    setClassroomsTable([
      { name: "Room 1", seats: 50 },
      { name: "Room 2", seats: 50 },
      { name: "Room 3", seats: 50 },
      { name: "Room 4", seats: 50 },
      { name: "Room 5", seats: 50 },
      { name: "Room 6", seats: 50 },
      { name: "Room 7", seats: 50 },
      { name: "Room 8", seats: 50 },
      { name: "Room 9", seats: 50 },
      { name: "Room 10", seats: 50 },
      { name: "Room 11", seats: 50 },
      { name: "Room 12", seats: 50 },
    ]);
    // start with one row for convenience
    setDepartmentsTable([{ name: "Computer Science", code: "CS", students: 600, exams: 3 }]);
  }
  recalcTotalSeats();
  wireEvents();
}

init();

