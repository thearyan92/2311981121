const { fetchNotifications } = require("../services/notificationService");
const { getTopNotifications } = require("../services/priorityService");
const Log = require("logging_middleware");

async function getNotifications(req, res, next) {
  try {
    const notifications = await fetchNotifications();
    const type = req.query.type;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const priority = req.query.priority === "true";

    const normalizedNotifications = Array.isArray(notifications)
      ? notifications
      : notifications.notifications || notifications.data || [];

    const filteredNotifications = type
      ? normalizedNotifications.filter((notification) => {
          return String(notification.type || notification.Type || "").toLowerCase() === String(type).toLowerCase();
        })
      : normalizedNotifications;

    if (priority) {
      res.status(200).json({
        data: getTopNotifications(filteredNotifications),
        meta: {
          total: Math.min(filteredNotifications.length, 10),
          page: 1,
          limit: 10,
          priority: true
        }
      });
      return;
    }

    const startIndex = (page - 1) * limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + limit);

    res.status(200).json({
      data: paginatedNotifications,
      meta: {
        total: filteredNotifications.length,
        page,
        limit,
        totalPages: Math.ceil(filteredNotifications.length / limit)
      }
    });
  } catch (error) {
    Log("backend", "error", "handler", `GET /notifications failed: ${error.message}`);
    next(error);
  }
}

module.exports = {
  getNotifications
};
