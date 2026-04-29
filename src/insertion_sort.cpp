#include "../include/insertion_sort.h"

void InsertionSort::sort(std::vector<Dept>& arr, int low, int high) {
    for (int i = low + 1; i <= high; i++) {
        Dept key = arr[i];
        int j = i - 1;
        
        while (j >= low && arr[j].getnoOfStudents() < key.getnoOfStudents()) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}