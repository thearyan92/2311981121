const Log = require("logging_middleware");

async function createFrontendLog(req, res) {
  const { stack, level, package: packageName, message } = req.body;
  const result = await Log(stack, level, packageName, message);

  if (result && result.success === false) {
    res.status(502).json(result);
    return;
  }

  res.status(201).json(result);
}

module.exports = {
  createFrontendLog
};
