#ifndef QUICK_SORT_H
#define QUICK_SORT_H

#include <vector>
#include "../include/department.h"

class QuickSort {
private:
static int partition(std::vector<Dept>& arr, int low, int high);

public:
static void sort(std::vector<Dept>& arr, int low, int high);
};

#endif