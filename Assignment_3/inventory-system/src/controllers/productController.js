const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const SORTABLE_FIELDS = [
  "name",
  "sku",
  "category",
  "price",
  "quantity",
  "createdAt",
  "updatedAt",
];
const PROTECTED_FIELDS = [
  "_id",
  "id",
  "__v",
  "createdAt",
  "updatedAt",
  "stockValue",
];

const first = (v) => (Array.isArray(v) ? v[0] : v);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

exports.getProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = {};

  if (q.category)
    filter.category = new RegExp(`^${escapeRegex(first(q.category))}$`, "i");
  if (q.supplier)
    filter.supplier = new RegExp(escapeRegex(first(q.supplier)), "i");
  if (q.search) {
    const rx = new RegExp(escapeRegex(first(q.search)), "i");
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.price = {};
    if (q.minPrice !== undefined) {
      const min = Number(first(q.minPrice));
      if (Number.isNaN(min))
        throw new ApiError(400, "minPrice must be a number");
      filter.price.$gte = min;
    }
    if (q.maxPrice !== undefined) {
      const max = Number(first(q.maxPrice));
      if (Number.isNaN(max))
        throw new ApiError(400, "maxPrice must be a number");
      filter.price.$lte = max;
    }
  }

  if (q.inStock !== undefined) {
    const v = String(first(q.inStock)).toLowerCase();
    if (v === "true") filter.quantity = { $gt: 0 };
    else if (v === "false") filter.quantity = 0;
    else throw new ApiError(400, "inStock must be true or false");
  }

  const sortSpec = {};
  const sortParam = q.sort ? String(first(q.sort)) : "-createdAt";
  sortParam.split(",").forEach((raw) => {
    const field = raw.trim().replace(/^-/, "");
    if (!field) return;
    if (!SORTABLE_FIELDS.includes(field)) {
      throw new ApiError(
        400,
        `Cannot sort by "${field}". Allowed: ${SORTABLE_FIELDS.join(", ")}`,
      );
    }
    sortSpec[field] = raw.trim().startsWith("-") ? -1 : 1;
  });
  sortSpec._id = 1;

  const page = q.page !== undefined ? Number(first(q.page)) : 1;
  const limit = q.limit !== undefined ? Number(first(q.limit)) : 10;
  if (!Number.isInteger(page) || page < 1)
    throw new ApiError(400, "page must be a positive integer");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "limit must be an integer between 1 and 100");
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  PROTECTED_FIELDS.forEach((f) => delete updates[f]);

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
});

exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true },
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new ApiError(404, "Product not found");
    throw new ApiError(400, "Insufficient stock for this sale");
  }

  res.json({ message: "Stock updated", product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ message: "Product deleted", id: product.id });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  }).sort({ quantity: 1 });

  res.json({ count: lowStockItems.length, lowStockItems });
});

exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" },
      },
    },
    { $addFields: { avgPrice: { $round: ["$avgPrice", 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});
