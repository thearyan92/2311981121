const express = require("express");
const { createFrontendLog } = require("../controllers/logController");

const router = express.Router();

router.post("/", createFrontendLog);

module.exports = router;
