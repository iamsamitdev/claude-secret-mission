// ============================================
// ตัวอย่างการเขียนฟังก์ชันใน JavaScript
// ============================================

// 1. Function Declaration (การประกาศฟังก์ชัน)
function greet(name) {
  return "Hello, " + name + "!";
}

console.log("--- 1. Function Declaration ---");
console.log(greet("Alice")); // "Hello, Alice!"


// 2. Function Expression (นิพจน์ฟังก์ชัน)
const add = function(a, b) {
  return a + b;
};

console.log("\n--- 2. Function Expression ---");
console.log("5 + 3 =", add(5, 3));


// 3. Arrow Function (ฟังก์ชันลูกศล)
const multiply = (a, b) => a * b;

console.log("\n--- 3. Arrow Function ---");
console.log("4 x 7 =", multiply(4, 7));


// 4. Arrow Function แบบมี block
const subtract = (a, b) => {
  const result = a - b;
  return result;
};

console.log("\n--- 4. Arrow Function with Block ---");
console.log("10 - 4 =", subtract(10, 4));


// 5. Function ที่มี parameter -default
function introduce(name, age = 25) {
  return `My name is ${name} and I'm ${age} years old.`;
}

console.log("\n--- 5. Default Parameters ---");
console.log(introduce("Bob"));
console.log(introduce("Charlie", 30));


// 6. Rest Parameters
function sumAll(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log("\n--- 6. Rest Parameters ---");
console.log("Sum of 1,2,3 =", sumAll(1, 2, 3));
console.log("Sum of 1,2,3,4,5 =", sumAll(1, 2, 3, 4, 5));


// 7. Function ที่คืนค่าหลายค่า (ผ่าน array)
function getMinMax(numbers) {
  return [Math.min(...numbers), Math.max(...numbers)];
}

console.log("\n--- 7. Return Multiple Values (Array) ---");
const [min, max] = getMinMax([10, 5, 20, 8]);
console.log("Min:", min, "Max:", max);


// 8. Function ที่คืนค่าหลายค่า (ผ่าน object)
function getPersonInfo() {
  return {
    name: "David",
    age: 28,
    city: "Bangkok"
  };
}

console.log("\n--- 8. Return Multiple Values (Object) ---");
const { name, age, city } = getPersonInfo();
console.log(`${name} is ${age} years old and lives in ${city}`);


// 9. High-Order Function (ฟังก์ชันที่รับฟังก์ชันเป็น argument)
function operate(a, b, callback) {
  return callback(a, b);
}

console.log("\n--- 9. High-Order Function ---");
console.log("Using add:", operate(5, 3, add));
console.log("Using multiply:", operate(5, 3, multiply));
console.log("Using custom:", operate(5, 3, (x, y) => x + y * 2));


// 10. Recursive Function (ฟังก์ชันที่เรียกตัวเอง)
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log("\n--- 10. Recursive Function ---");
console.log("5! =", factorial(5));


// 11. Callback Function
function processData(data, callback) {
  const processed = data.map(item => item * 2);
  callback(processed);
}

console.log("\n--- 11. Callback Function ---");
processData([1, 2, 3], (result) => {
  console.log("Processed data:", result);
});


// 12. IIFE (Immediately Invoked Function Expression)
console.log("\n--- 12. IIFE ---");
(function() {
  const message = "This is an IIFE";
  console.log(message);
})();

console.log("\n======================================");
console.log("End of examples!");
