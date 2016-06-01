//Codility Question 4.1

function solution(X, A) {
    // write your code in JavaScript (Node.js 4.0.0)
    
    var X = 5;
    var A = [1, 3, 1, 4, 2, 3, 5, 4];
    var copyArray = A;
    console.log("Copy1: "+copyArray);
    
    
    
    
    console.log("Number of Leaves: "+X);
    console.log("Array: "+A);
    
    var arraySorted = copyArray.sort();
    //console.log("Sorted array: "+arraySorted);
    console.log("Copy2: "+copyArray);
    var uniqueArray = copyArray.filter(function(elem, pos) {
        return copyArray.indexOf(elem) == pos;
    });
    console.log("Copy3: "+copyArray);
    console.log("New unique array:"+uniqueArray);
    console.log("Copy4: "+copyArray);
    var index = copyArray.indexOf(2);
    console.log(index);
    console.log("Array: "+A);
    var i = 0;
    
    for (i = 0; i < uniqueArray.length; i++) {
        if (copyArray.indexOf(uniqueArray[i]) === -1) {
            console.log("Does not have all the leaves: " + -1);
        } else {
            console.log("---");
            console.log("Value in unique array: "+uniqueArray[i]);
            console.log("Position in the array: "+A.indexOf(uniqueArray[i]));
            console.log("---");
        }
    }
    
    

}