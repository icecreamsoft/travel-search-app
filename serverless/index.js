const serverless = require("serverless-http");
const app = require("./dist/app");

module.exports.handler = serverless(app);
