#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include "../include/greedy_scheduler.h"
#include "../include/quick_sort.h" 
#include "../include/display.h"

struct Shift {
    int day;
    std::string timeName;
    std::string timeSlot;
    int remainingCapacity;
};

std::string formatTime(int startHour, int duration) {
    int endHour24 = startHour + duration;
    int endHour12 = endHour24 % 12;
    if (endHour12 == 0) endHour12 = 12;
    std::string amPm = (endHour24 >= 12 && endHour24 < 24) ? "PM" : "AM";
    std::string endStr = (endHour12 < 10 ? "0" : "") + std::to_string(endHour12) + ":00 " + amPm;
    
    int startHour12 = startHour % 12;
    if (startHour12 == 0) startHour12 = 12;
    std::string startAmPm = (startHour >= 12 && startHour < 24) ? "PM" : "AM";
    std::string startStr = (startHour12 < 10 ? "0" : "") + std::to_string(startHour12) + ":00 " + startAmPm;

    return startStr + " - " + endStr;
}

void addNewDay(std::vector<Shift>& shifts, int maxCapacity, int numShifts, int examLength) {
    int nextDay = (shifts.size() / numShifts) + 1;
    
    if (numShifts >= 1) {
        shifts.push_back({nextDay, "Morning", formatTime(8, examLength), maxCapacity});
    }
    if (numShifts >= 2) {
        shifts.push_back({nextDay, "Afternoon", formatTime(12, examLength), maxCapacity});
    }
    if (numShifts >= 3) {
        shifts.push_back({nextDay, "Evening", formatTime(16, examLength), maxCapacity});
    }
}

std::string formatRoll(int num) {
    std::stringstream ss;
    ss << std::setw(3) << std::setfill('0') << num;
    return ss.str();
}

std::vector<RoomAllocation> allocateRooms(int students, std::string code, int roomCapacity) {
    std::vector<RoomAllocation> allocations;
    int studentsToAssign = students;
    int currentRoll = 1;
    int currentRoomNum = 1; 

    while (studentsToAssign > 0) {
        int studentsInThisRoom = std::min(studentsToAssign, roomCapacity);
        
        std::string rollRange = code + "-" + formatRoll(currentRoll) + " to " 
                              + code + "-" + formatRoll(currentRoll + studentsInThisRoom - 1);
        
        allocations.push_back({currentRoomNum, rollRange});
        
        currentRoll += studentsInThisRoom;
        studentsToAssign -= studentsInThisRoom;
        currentRoomNum++;
    }
    return allocations;
}

std::vector<Assignment> Scheduler::generateSchedule(std::vector<Dept>& departments, Seats& collegeCapacity, int numShifts, int examLength, int examGap) {
    QuickSort::sort(departments, 0, departments.size() - 1);

    int maxCapacity = collegeCapacity.gettotalSeatsAvailable();
    int roomCapacity = collegeCapacity.getaccomodationInClass();
    
    std::vector<Shift> shifts;
    addNewDay(shifts, maxCapacity, numShifts, examLength); 

    std::vector<Assignment> finalSchedule;

    std::cout << "\n--- Algorithm Trace: First-Fit Decreasing ---\n";
    std::cout << "Initial Capacity: " << maxCapacity << " seats per shift.\n";
    std::cout << "Constraints Setup: " << numShifts << " shift(s)/day, " << examGap << " day gap required.\n";

    for (size_t i = 0; i < departments.size(); i++) {
        Dept& currentDept = departments[i];
        int students = currentDept.getnoOfStudents();
        int exams = currentDept.getnoOfExams();
        std::string deptCode = currentDept.getdeptCode();
        
        std::cout << "\nProcessing " << currentDept.getnameOfDept() 
                  << " (" << students << " students, " << exams << " exams)\n";

        std::vector<int> daysUsedByThisDept;

        for (int e = 1; e <= exams; e++) {
            std::cout << "  * Exam " << e << ":\n";
            bool scheduled = false;

            while (!scheduled) {
                for (size_t s = 0; s < shifts.size(); s++) {
                    
                    bool conflict = false;
                    for (size_t d = 0; d < daysUsedByThisDept.size(); d++) {
                        if (std::abs(shifts[s].day - daysUsedByThisDept[d]) <= examGap) {
                            conflict = true; 
                            break;
                        }
                    }

                    if (!conflict && shifts[s].remainingCapacity >= students) {
                        std::cout << "      - Checking Day " << shifts[s].day << ", " << shifts[s].timeName << "... Fits!\n";
                        
                        shifts[s].remainingCapacity -= students;
                        daysUsedByThisDept.push_back(shifts[s].day);
                        
                        std::vector<RoomAllocation> assignedRooms = allocateRooms(students, deptCode, roomCapacity);
                        finalSchedule.push_back({currentDept.getnameOfDept(), deptCode, e, shifts[s].day, shifts[s].timeName, shifts[s].timeSlot, assignedRooms});
                        
                        scheduled = true;
                        break; 
                    }
                }

                if (!scheduled) {
                    std::cout << "      - Calendar too short for gap constraint. Expanding calendar...\n";
                    addNewDay(shifts, maxCapacity, numShifts, examLength);
                }
            }
        }
    }
    
    return finalSchedule; 
}