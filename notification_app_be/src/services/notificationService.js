const axios = require("axios");
const Log = require("logging_middleware");

const NOTIFICATIONS_API_URL = "http://20.207.122.201/evaluation-service/notifications";

async function fetchNotifications() {
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken || accessToken === "YOUR_ACCESS_TOKEN_HERE") {
    throw new Error("ACCESS_TOKEN is missing. Add it to the root .env file.");
  }

  const response = await axios.get(NOTIFICATIONS_API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    timeout: 10000
  });

  Log("backend", "info", "service", "Fetched notifications from evaluation service");

  return response.data;
}

module.exports = {
  fetchNotifications
};
