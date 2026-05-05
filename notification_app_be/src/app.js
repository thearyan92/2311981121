const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const logRoutes = require("./routes/logRoutes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = new Set([
        process.env.FRONTEND_ORIGIN || "http://localhost:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ]);

      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/notifications", notificationRoutes);
app.use("/logs", logRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
