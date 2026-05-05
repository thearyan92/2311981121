# Notification System Design

## Stage 1: REST APIs and Real-Time Delivery

### GET /notifications

Fetch notifications for a student with optional filters and pagination.

**Query parameters**

```http
GET /notifications?studentID=2311981121&type=Placement&page=1&limit=10&isRead=false
```

**Response**

```json
{
  "data": [
    {
      "id": "noti_101",
      "studentID": "2311981121",
      "type": "Placement",
      "message": "Placement drive starts tomorrow.",
      "isRead": false,
      "createdAt": "2026-05-05T06:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /notifications

Create one notification.

**Request**

```json
{
  "studentID": "2311981121",
  "type": "Event",
  "message": "Technical fest registration is open."
}
```

**Response**

```json
{
  "id": "noti_102",
  "studentID": "2311981121",
  "type": "Event",
  "message": "Technical fest registration is open.",
  "isRead": false,
  "createdAt": "2026-05-05T07:00:00.000Z"
}
```

### PATCH /notifications/:id/read

Mark a notification as read.

**Request**

```json
{
  "isRead": true
}
```

**Response**

```json
{
  "id": "noti_102",
  "isRead": true,
  "updatedAt": "2026-05-05T07:05:00.000Z"
}
```

### Real-Time Mechanism

WebSocket delivery is best for instant notification updates. The frontend opens a socket connection after authentication, and the server emits `notification.created` events when new notifications are available. If WebSocket support is unavailable, polling every 30 to 60 seconds is a simpler fallback.

## Stage 2: PostgreSQL Data Model

Use PostgreSQL because notifications need durability, relational querying, indexing, and transactional writes.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentID VARCHAR(32) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
  message TEXT NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT false,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Large datasets can create slow queries when millions of rows are scanned for one student. Common solutions include indexing frequently used filters, partitioning old data by month or year, and archiving stale notifications.

## Stage 3: Query Optimization

A slow query often happens because the database performs a full table scan. For example, filtering by `studentID`, `isRead`, and `createdAt` without a matching index forces PostgreSQL to inspect too many rows.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

This index helps because the API commonly fetches recent unread notifications for a student. Indexing every column is bad because indexes consume disk space, slow down inserts and updates, and can confuse the query planner when many low-value indexes exist.

Placement notifications in the last 7 days:

```sql
SELECT id, studentID, type, message, isRead, createdAt
FROM notifications
WHERE studentID = '2311981121'
  AND type = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC
LIMIT 20;
```

## Stage 4: Performance Improvements

Pagination limits each response to a manageable number of records and avoids loading the entire notification history. Redis caching can store the latest notifications for active students, reducing repeated database reads. Lazy loading on the frontend fetches older notifications only when the user reaches the next page or asks for more history.

## Stage 5: Scalable notify_all

The `notify_all` operation should enqueue work into RabbitMQ or Kafka instead of sending every email, push notification, and database insert inside one HTTP request. A producer writes notification jobs to the queue, and worker processes consume those jobs asynchronously.

This improves scalability because more workers can be added during high traffic. It improves fault tolerance because failed jobs can be retried, dead-lettered, or replayed without losing the original notification request.

```text
API request -> queue topic -> worker pool -> database write
                                -> email provider
                                -> push notification service
```

## Stage 6: Priority Function

```js
const priorityOrder = {
  placement: 3,
  result: 2,
  event: 1
};

function getTimestampValue(notification) {
  const timestamp =
    notification.timestamp ||
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
      const firstPriority = priorityOrder[String(first.type || "").toLowerCase()] || 0;
      const secondPriority = priorityOrder[String(second.type || "").toLowerCase()] || 0;

      if (firstPriority !== secondPriority) {
        return secondPriority - firstPriority;
      }

      return getTimestampValue(second) - getTimestampValue(first);
    })
    .slice(0, 10);
}
```
