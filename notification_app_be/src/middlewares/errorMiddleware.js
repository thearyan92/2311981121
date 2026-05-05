const Log = require("logging_middleware");

function notFoundHandler(req, res, next) {
  Log("backend", "warn", "handler", `Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found"
  });
}

function errorHandler(error, req, res, next) {
  Log("backend", "error", "handler", error.message || "Unhandled backend error");
  res.status(error.statusCode || 500).json({
    message: error.response?.data?.message || error.message || "Internal server error"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
