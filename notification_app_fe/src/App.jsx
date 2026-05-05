import React from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Toolbar,
  Typography
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useEffect, useMemo, useState } from "react";
import { fetchNotifications } from "./api/notificationsApi";
import { Log } from "./utils/log";

const filterOptions = ["All", "Event", "Result", "Placement"];

function formatTimestamp(notification) {
  const value =
    notification.timestamp ||
    notification.Timestamp ||
    notification.createdAt ||
    notification.created_at ||
    notification.date;

  if (!value) {
    return "Unavailable";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function getNotificationMessage(notification) {
  return notification.message || notification.Message || notification.title || notification.description || "No message provided";
}

function getNotificationType(notification) {
  return notification.type || notification.Type || "Unknown";
}

function App() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [type, setType] = useState("All");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [priorityView, setPriorityView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = useMemo(() => (type === "All" ? "" : type), [type]);

  async function loadNotifications(nextPage = page, nextLimit = limit, nextPriority = priorityView) {
    setLoading(true);
    setError("");

    try {
      await Log("frontend", "info", "api", "Fetching notifications from backend");
      const response = await fetchNotifications({
        type: selectedType,
        page: nextPage + 1,
        limit: nextPriority ? 10 : nextLimit,
        priority: nextPriority
      });

      setNotifications(response.data || []);
      setMeta(response.meta || { total: 0, page: nextPage + 1, limit: nextLimit });
      await Log("frontend", "info", "state", "Notifications loaded into React state");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to load notifications");
      await Log("frontend", "error", "api", "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(0, limit, priorityView);
  }, [selectedType, priorityView]);

  function handlePageChange(event, nextPage) {
    setPage(nextPage);
    loadNotifications(nextPage, limit, priorityView);
  }

  function handleLimitChange(event) {
    const nextLimit = Number(event.target.value);
    setLimit(nextLimit);
    setPage(0);
    loadNotifications(0, nextLimit, priorityView);
  }

  function handleTypeChange(event) {
    setType(event.target.value);
    setPage(0);
  }

  function togglePriorityView() {
    const nextPriority = !priorityView;
    setPriorityView(nextPriority);
    setPage(0);
  }

  return (
    <Box className="appShell">
      <AppBar position="static" elevation={0} color="transparent" className="topBar">
        <Toolbar>
          <NotificationsActiveIcon color="primary" />
          <Typography variant="h6" component="h1" sx={{ ml: 1, fontWeight: 700 }}>
            Notification System
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={5}>
            <Typography variant="h4" component="h2">
              Campus Notifications
            </Typography>
            <Typography color="text.secondary">
              Review event, result, and placement updates with filters and priority sorting.
            </Typography>
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  value={type}
                  label="Type"
                  onChange={handleTypeChange}
                >
                  {filterOptions.map((option) => (
                    <MenuItem value={option} key={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant={priorityView ? "contained" : "outlined"}
                startIcon={<PriorityHighIcon />}
                onClick={togglePriorityView}
              >
                Top 10
              </Button>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadNotifications()}>
                Refresh
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Paper elevation={0} className="summaryBand">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Chip label={`Total: ${meta.total || notifications.length}`} color="primary" variant="outlined" />
            <Chip label={`View: ${priorityView ? "Priority" : "Paginated"}`} color="secondary" variant="outlined" />
            <Chip label={`Filter: ${type}`} variant="outlined" />
          </Stack>
        </Paper>

        <TableContainer component={Paper} elevation={0} className="tableWrap">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <TableRow key={notification.id || notification.ID || `${getNotificationType(notification)}-${index}`}>
                    <TableCell>
                      <Chip size="small" label={getNotificationType(notification)} className="typeChip" />
                    </TableCell>
                    <TableCell>{getNotificationMessage(notification)}</TableCell>
                    <TableCell>{formatTimestamp(notification)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    {loading ? "Loading notifications..." : "No notifications found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!priorityView ? (
            <TablePagination
              component="div"
              count={meta.total || 0}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={limit}
              onRowsPerPageChange={handleLimitChange}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          ) : null}
        </TableContainer>
      </Container>
    </Box>
  );
}

export default App;
