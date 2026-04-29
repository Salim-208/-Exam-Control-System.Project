#ifndef DEPARTMENT_H
#define DEPARTMENT_H
#include <string>

class Dept{
private:
std::string nameOfDept;
int noOfStudents = 0;
int noOfExams = 0;  
std::string deptCode;

void setnameOfDept();
void setnoOfStudents();
void setnoOfExams();
void setdeptCode();

public:

Dept();
std::string getnameOfDept();
int getnoOfStudents();
int getnoOfExams();
std::string getdeptCode();
};

#endif