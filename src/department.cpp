#include <iostream>
#include "../include/department.h"
#include <string>
#include <limits>

Dept::Dept(){
setnameOfDept();
setnoOfStudents();
setnoOfExams();
setdeptCode();
}

void Dept::setnameOfDept(){
    std::cout<<"Enter the name of the Department: ";

    std::getline(std::cin,nameOfDept);
}

void Dept::setnoOfStudents(){
    std::cout<<"Enter the no of Students in this Department: ";
    std::cin>>noOfStudents;
}

void Dept::setnoOfExams(){
    std::cout<<"Enter the total no of Exams to be conducted in this Department: ";
    std::cin>>noOfExams;
}

void Dept::setdeptCode() {
    std::cin.clear();
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    
    std::cout << "Enter the Department Code (e.g., CS, ME, EC etc): ";
    std::getline(std::cin, deptCode);
}

std::string Dept::getnameOfDept(){
    return nameOfDept;
}

int Dept::getnoOfStudents(){
    return noOfStudents;
}

int Dept::getnoOfExams(){
    return noOfExams;
}

std::string Dept::getdeptCode() {
    return deptCode;
}
