#include "../include/quick_sort.h"
#include "../include/insertion_sort.h"
#include <algorithm>
#include <cstdlib>
#include <ctime>

int QuickSort::partition(std::vector<Dept>& arr, int low, int high) {

    int randomIndex = low + rand() % (high - low + 1); 

    std::swap(arr[randomIndex], arr[high]); 

    int pivot = arr[high].getnoOfStudents();
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j].getnoOfStudents() > pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void QuickSort::sort(std::vector<Dept>& arr, int low, int high) {
    while (low < high) {
       
        if (high - low < 10) {
            InsertionSort::sort(arr, low, high);
            break;
        } else {
            
            int pivotIndex = partition(arr, low, high);
           
            if (pivotIndex - low < high - pivotIndex) {
                sort(arr, low, pivotIndex - 1);
                low = pivotIndex + 1;
            } else {
                sort(arr, pivotIndex + 1, high);
                high = pivotIndex - 1;
            }
        }
    }
}