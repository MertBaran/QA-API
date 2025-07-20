NODE_ENV=test
require("dotenv").config({path: "./config/env/config.env.test"});
console.log("REDIS_URL:", process.env.REDIS_URL ? "Found" : "Missing");
console.log("First 30 chars:", process.env.REDIS_URL?.substring(0, 30));
