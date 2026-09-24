// Unit 3 - Week 1 - Day 1: JSON Data Processing & Array Methods
const fs = require("fs");
const path = require("path");

const rawData = fs.readFileSync(path.join(__dirname, "1.json"), "utf-8");
const users = JSON.parse(rawData);

console.log(`Total users loaded: ${users.length}`);

// 1. Filter users from Japan
const japanUsers = users.filter((u) => u.native === "Japan");
console.log(`Users from Japan: ${japanUsers.length}`);

// 2. Calculate average age
const totalAge = users.reduce((sum, u) => sum + u.age, 0);
const avgAge = (totalAge / users.length).toFixed(2);
console.log(`Average user age: ${avgAge}`);

// 3. Find high balance users (> 50000)
const wealthyUsers = users.filter((u) => u.balance > 50000);
console.log(`Users with balance > 50000: ${wealthyUsers.length}`);
