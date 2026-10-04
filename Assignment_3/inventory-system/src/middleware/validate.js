const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

exports.validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ApiError(400, `Invalid product id: ${req.params.id}`));
  }
  next();
};

exports.requireBody = (req, res, next) => {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    return next(new ApiError(400, "Request body cannot be empty"));
  }
  next();
};

exports.validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (!Number.isInteger(change) || change === 0) {
    return next(
      new ApiError(
        400,
        '"change" must be a non-zero integer (positive = restock, negative = sale)',
      ),
    );
  }
  next();
};
