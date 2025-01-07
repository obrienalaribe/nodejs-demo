require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Import the Mongoose model
const mongoose = require("mongoose");
const Record = require("./models/Record");

const {
  register,
  requestMetricsMiddleware,
  dbQueryDuration,
} = require("./metrics/custom");

// Setup Winston Logger
const winston = require("winston");
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // Default to 'info' level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(), // Log to console
  ],
});

// Middleware for Logging Requests
app.use((req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(express.json());
app.use(requestMetricsMiddleware); // Track HTTP requests

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// /metrics Endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// POST Route with Logging
app.post("/data", async (req, res) => {
  logger.debug("POST /data called");
  logger.info(`Data received: ${JSON.stringify(req.body)}`);
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).send("Name and email are required");
  }

  const end = dbQueryDuration.startTimer({ operation: "insert" }); // Start measuring db insert
  try {
    logger.debug(`Creating new record for ${name}:`);
    const record = new Record({ name, email });
    await record.save();
    end(); // End metric measuring
    res.status(201).send(`Data saved with ID: ${record.id}`);
  } catch (err) {
    end(); // End measuring even on failure
    console.error("Failed to save record:", err.message);
    res.status(500).send("Failed to save data");
  }
});

// GET /data - Retrieve all records from MongoDB
app.get("/data", async (req, res) => {
  const end = dbQueryDuration.startTimer({ operation: "find" }); // Start measuring on fetch
  try {
    logger.debug(`Fetching all records`);
    const records = await Record.find();
    end(); // End measuring find
    logger.info(`Fetched all records`);
    res.status(200).json(records);
  } catch (err) {
    console.error("Failed to fetch records:", err.message);
    res.status(500).send("Failed to fetch data");
  }
});

app.get("/", (req, res) => {
  logger.debug("GET / called");
  res.status(200).send("Version: v1.0.0");
});

app.get("/ready", async (req, res) => {
  try {
    logger.debug("Checking db connection status");
    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send("Database not ready");
    }

    // Check database write/read capability by attempting a lightweight query
    await Record.findOne();
    logger.info("Could fetch data from db");
    res.send("Database is ready");
  } catch (err) {
    console.error("Database readiness check failed:", err.message);
    res.status(503).send("Database not ready");
  }
});

// Error-Prone Route
app.get("/error", (req, res, next) => {
  try {
    logger.debug("GET /error called");
    console.log(undefinedVariable); // This will throw a ReferenceError
    res.send("This will never be reached");
  } catch (error) {
    logger.error(`Error occurred: ${error.message}`);
    next(error);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Global Error Handler: ${err.message}`);
  res.status(500).send("An unexpected error occurred");
});

// Start Server with Port Conflict Handling
app.listen(PORT, (err) => {
  if (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
  logger.info(
    `Server is running in ${process.env.NODE_ENV} on http://localhost:${PORT}`,
  );
});
