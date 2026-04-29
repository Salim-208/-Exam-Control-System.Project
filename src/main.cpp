#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <limits>
#include "../include/department.h"
#include "../include/seats.h"
#include "../include/greedy_scheduler.h"
#include "../include/display.h"

using namespace std;

void clearInput() {
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int main() {
    srand(time(0));

    cout << "=========================================\n";
    cout << "       Concurrency Based Exam Scheduling System        \n";
    cout << "=========================================\n\n";

    cout << "--- Step 1: Set College Capacity ---\n";
    Seats collegeCapacity; 
    
    cout << "\nCapacity Set! Maximum seats per shift: " 
         << collegeCapacity.gettotalSeatsAvailable() << "\n\n";

    cout << "--- Step 2: Global Constraints ---\n";
    int numShifts = 0, examLength = 0, examGap = 0;
    
    cout << "Enter max shifts per day (1 = Morning, 2 = Morning & Afternoon, 3 = Morning , Afternoon & Evening): ";
    cin >> numShifts;
    
    cout << "Enter exam duration (in hours, e.g., 3): ";
    cin >> examLength;
    
    cout << "Enter required day gap between a department's exams (0 = daily, 1 = 1 day gap): ";
    cin >> examGap;

    cout << "\n--- Step 3: Add Departments ---\n";
    int numDepartments = 0;
    cout << "Enter the total number of departments: ";
    cin >> numDepartments;
    
    clearInput(); 

    vector<Dept> departments;
    for (int i = 0; i < numDepartments; i++) {
        cout << "\n[ Adding Department " << (i + 1) << " ]\n";
        
        Dept newDept; 
        departments.push_back(newDept);
    }

    cout << "\n=========================================\n";
    cout << "       GENERATING EXAM SCHEDULE...       \n";
    cout << "=========================================\n";
    
    vector<Assignment> finalSchedule = Scheduler::generateSchedule(departments, collegeCapacity, numShifts, examLength, examGap);

    int choice = 0;
    while (choice != 5) {
        cout << "\n=========================================\n";
        cout << "            VIEW SCHEDULE MENU           \n";
        cout << "=========================================\n";
        cout << "1. View by Department\n";
        cout << "2. View by Day\n";
        cout << "3. View Seating & Roll Numbers\n";
        cout << "4. Export Schedule to CSV\n";
        cout << "5. Exit Program\n";
        cout << "Enter your choice: ";
        cin >> choice;

        switch(choice) {
            case 1: 
                Display::printByDepartment(finalSchedule); 
                break;
            case 2: 
                Display::printByDay(finalSchedule); 
                break;
            case 3: 
                Display::printByRoom(finalSchedule); 
                break;
            case 4: 
                Display::exportToCSV(finalSchedule); 
                break;
            case 5: 
                cout << "\nExiting system. Goodbye!\n"; 
                break;
            default: 
                cout << "Invalid choice. Please try again.\n"; 
                clearInput(); 
                break;
        }
    }

    return 0;
}