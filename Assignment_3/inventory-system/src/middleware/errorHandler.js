const ApiError = require("../utils/ApiError");

exports.notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors;

  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for field "${err.path}": ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value: a product with this ${field} already exists`;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON in request body";
  }

  const body = { message };
  if (errors) body.errors = errors;
  if (status === 500 && process.env.NODE_ENV !== "production")
    body.stack = err.stack;

  res.status(status).json(body);
};
