#include <iostream>
#include <iomanip>
#include <fstream>
#include <algorithm>
#include "../include/display.h"

void Display::printByDepartment(const std::vector<Assignment>& schedule) {
    std::cout << "\n==============================================================\n";
    std::cout << "         UNIVERSITY EXAM SCHEDULING SYSTEM (BY DEPT)      \n";
    std::cout << "==============================================================\n";
    
    std::string currentDept = "";

    for (size_t i = 0; i < schedule.size(); i++) {
        const auto& entry = schedule[i];
        
        if (currentDept != entry.deptName) {
            currentDept = entry.deptName;
            std::cout << "\n[" << currentDept << "]\n"; 
        }
        
        std::cout << "  Exam " << std::left << std::setw(5) << entry.examNum 
                  << " | Day " << std::setw(5) << entry.day 
                  << " | " << std::setw(10) << entry.shiftName 
                  << " (" << entry.timeSlot << ")\n";
    }
    std::cout << "\n==============================================================\n";
}

void Display::printByDay(const std::vector<Assignment>& schedule) {
    std::vector<Assignment> sortedSchedule = schedule;
    std::sort(sortedSchedule.begin(), sortedSchedule.end(), [](const Assignment& a, const Assignment& b) {
        if (a.day != b.day) return a.day < b.day;
        return a.shiftName > b.shiftName;
    });

    std::cout << "\n==============================================================\n";
    std::cout << "         UNIVERSITY EXAM SCHEDULING SYSTEM (BY DAY)       \n";
    std::cout << "==============================================================\n";
    
    int currentDay = -1;

    for (size_t i = 0; i < sortedSchedule.size(); i++) {
        const auto& entry = sortedSchedule[i];
        
        if (currentDay != entry.day) {
            currentDay = entry.day;
            std::cout << "\n[ DAY " << currentDay << " ]\n"; 
        }
        
        std::cout << "  " << std::left << std::setw(10) << entry.shiftName 
                  << " (" << entry.timeSlot << ")"
                  << " | " << std::setw(15) << entry.deptName 
                  << " | Exam " << entry.examNum << "\n";
    }
    std::cout << "\n==============================================================\n";
}

void Display::printByRoom(const std::vector<Assignment>& schedule) {
    std::cout << "\n==============================================================\n";
    std::cout << "           SEATING PLAN (ROOMS & ROLL NUMBERS)            \n";
    std::cout << "==============================================================\n";
    
    for (size_t i = 0; i < schedule.size(); i++) {
        const auto& entry = schedule[i];
        
        std::cout << "\n" << entry.deptName << " (Exam " << entry.examNum << ") - Day " 
                  << entry.day << " " << entry.shiftName << "\n";
        std::cout << "--------------------------------------------------------------\n";
        
        for (size_t r = 0; r < entry.rooms.size(); r++) {
            const auto& room = entry.rooms[r];
            std::cout << "  Room " << std::left << std::setw(4) << room.roomNumber 
                      << " | Roll Nos: " << room.rollRange << "\n";
        }
    }
    std::cout << "\n==============================================================\n";
}

void Display::exportToCSV(const std::vector<Assignment>& schedule) {
    std::ofstream file("ExamSchedule.csv");
    
    if (!file.is_open()) {
        std::cout << "\n[ERROR] Could not create CSV file. Please check folder permissions.\n";
        return;
    }

    file << "Department,Exam Number,Day,Shift,Time Slot,Room,Roll Numbers\n";
    
    for (size_t i = 0; i < schedule.size(); i++) {
        const auto& entry = schedule[i];
        
        for (size_t r = 0; r < entry.rooms.size(); r++) {
            const auto& room = entry.rooms[r];
            file << entry.deptName << "," 
                 << entry.examNum << "," 
                 << entry.day << "," 
                 << entry.shiftName << "," 
                 << entry.timeSlot << "," 
                 << "Room " << room.roomNumber << "," 
                 << room.rollRange << "\n";
        }
    }
    
    file.close();
    std::cout << "\n[SUCCESS] Schedule successfully exported to 'ExamSchedule.csv'!\n";
}