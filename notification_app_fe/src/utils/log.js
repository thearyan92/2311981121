import { sendFrontendLog } from "../api/notificationsApi";

const allowedLevels = new Set(["debug", "info", "warn", "error", "fatal"]);
const allowedPackages = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils"
]);

export async function Log(stack, level, packageName, message) {
  try {
    if (stack !== "frontend") {
      throw new Error("Frontend logger only accepts frontend stack logs");
    }

    if (!allowedLevels.has(level)) {
      throw new Error(`Invalid level: ${level}`);
    }

    if (!allowedPackages.has(packageName)) {
      throw new Error(`Invalid frontend package: ${packageName}`);
    }

    return await sendFrontendLog({
      stack,
      level,
      package: packageName,
      message
    });
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Frontend logging failed"
    };
  }
}
