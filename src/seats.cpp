#include <iostream>
#include "../include/seats.h"

Seats::Seats(){
settotalClassRooms();
setaccomodationInClass();
settotalSeatsAvailable();
}

void Seats::settotalClassRooms(){
    std::cout<<"Enter the total no of classrooms available: ";
    std::cin>>totalClassRooms;
}
void Seats::setaccomodationInClass(){
    std::cout<<"Enter the accomodation of a classroom: ";
    std::cin>>accomodationInClass;
}
void Seats::settotalSeatsAvailable(){
    totalSeatsAvailable = totalClassRooms * accomodationInClass;
}
int Seats::gettotalClassRooms(){
    return totalClassRooms;
}
int Seats::getaccomodationInClass(){
    return accomodationInClass;
}
int Seats::gettotalSeatsAvailable(){
    return totalSeatsAvailable;
}
