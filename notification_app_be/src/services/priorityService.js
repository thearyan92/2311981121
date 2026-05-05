const priorityOrder = {
  placement: 3,
  result: 2,
  event: 1
};

function getTimestampValue(notification) {
  const timestamp =
    notification.timestamp ||
    notification.Timestamp ||
    notification.createdAt ||
    notification.created_at ||
    notification.date;

  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTopNotifications(notifications) {
  if (!Array.isArray(notifications)) {
    return [];
  }

  return [...notifications]
    .sort((first, second) => {
      const firstPriority = priorityOrder[String(first.type || first.Type || "").toLowerCase()] || 0;
      const secondPriority = priorityOrder[String(second.type || second.Type || "").toLowerCase()] || 0;

      if (firstPriority !== secondPriority) {
        return secondPriority - firstPriority;
      }

      return getTimestampValue(second) - getTimestampValue(first);
    })
    .slice(0, 10);
}

module.exports = {
  getTopNotifications
};
