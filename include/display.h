#ifndef DISPLAY_H
#define DISPLAY_H

#include <vector>
#include <string>

struct RoomAllocation {
    int roomNumber;
    std::string rollRange;
};

struct Assignment {
    std::string deptName;
    std::string deptCode;
    int examNum;
    int day;
    std::string shiftName;
    std::string timeSlot;
    std::vector<RoomAllocation> rooms;
};

class Display {
public:
    static void printByDepartment(const std::vector<Assignment>& schedule);
    static void printByDay(const std::vector<Assignment>& schedule);
    static void printByRoom(const std::vector<Assignment>& schedule);
    static void exportToCSV(const std::vector<Assignment>& schedule);
};

#endif