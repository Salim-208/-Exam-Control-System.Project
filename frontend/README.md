# Frontend (HTML/CSS/JS) — Opti-Schedule

This is a **standalone frontend** for your exam timetable generator. It mirrors the logic in your C++ code:

- First-Fit Decreasing (FFD) greedy scheduling
- Limited seats per shift
- Shifts per day (Morning/Afternoon/Evening)
- Exam duration to compute time slots
- Gap constraint between exams of the same department
- Room allocations + roll number ranges
- CSV export format matches `src/display.cpp` exporter

## Run

Open `index.html` in any modern browser:

- `Exam Control System/frontend/index.html`

No server / no install required.

## Output CSV

Exports `ExamSchedule.csv` with columns:

`Department,Exam Number,Day,Shift,Time Slot,Room,Roll Numbers`

