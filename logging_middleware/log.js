const axios = require(require.resolve("axios", { paths: [process.cwd(), __dirname] }));
const path = require("path");
require(require.resolve("dotenv", { paths: [process.cwd(), __dirname] })).config({
  path: path.resolve(__dirname, "../.env")
});

const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";

const allowedStacks = new Set(["backend", "frontend"]);
const allowedLevels = new Set(["debug", "info", "warn", "error", "fatal"]);
const backendPackages = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service"
]);
const frontendPackages = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style"
]);

function isValidPackage(stack, packageName) {
  if (stack === "backend") {
    return backendPackages.has(packageName);
  }

  if (stack === "frontend") {
    return frontendPackages.has(packageName);
  }

  return false;
}

async function Log(stack, level, packageName, message) {
  try {
    if (!allowedStacks.has(stack)) {
      throw new Error(`Invalid stack: ${stack}`);
    }

    if (!allowedLevels.has(level)) {
      throw new Error(`Invalid level: ${level}`);
    }

    if (!isValidPackage(stack, packageName)) {
      throw new Error(`Invalid package '${packageName}' for ${stack}`);
    }

    const accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken || accessToken === "YOUR_ACCESS_TOKEN_HERE") {
      throw new Error("ACCESS_TOKEN is missing. Add it to the root .env file.");
    }

    const response = await axios.post(
      LOG_API_URL,
      {
        stack,
        level,
        package: packageName,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Logging failed"
    };
  }
}

module.exports = Log;
