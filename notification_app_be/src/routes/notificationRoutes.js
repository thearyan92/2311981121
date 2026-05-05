const express = require("express");
const { getNotifications } = require("../controllers/notificationController");
const Log = require("logging_middleware");

const router = express.Router();

router.get("/", async (req, res, next) => {
  Log("backend", "info", "route", "GET /notifications request started");
  next();
}, getNotifications);

module.exports = router;
