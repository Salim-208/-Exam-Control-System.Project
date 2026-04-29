#ifndef SEATS_H
#define SEATS_H

class Seats{
private:
int totalClassRooms = 0;
int accomodationInClass = 0;
int totalSeatsAvailable = 0;

void settotalClassRooms();
void setaccomodationInClass();
void settotalSeatsAvailable();

public:

Seats();
int gettotalClassRooms();
int getaccomodationInClass();
int gettotalSeatsAvailable();
};




#endif
