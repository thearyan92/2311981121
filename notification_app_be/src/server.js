const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const app = require("./app");
const Log = require("logging_middleware");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Notification backend listening on http://localhost:${PORT}`);

  Log("backend", "info", "service", `Notification backend started on port ${PORT}`).then((result) => {
    if (result && result.success === false) {
      console.warn(`Startup log failed: ${result.message}`);
    }
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set PORT to another value.`);
    process.exit(1);
  }

  throw error;
});
