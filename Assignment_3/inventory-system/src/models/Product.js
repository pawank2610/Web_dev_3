const mongoose = require("mongoose");

const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Furniture",
  "Stationery",
  "Groceries",
  "Home Appliances",
  "Books",
  "Other",
];

const isInteger = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9-]+$/,
        "SKU can only contain letters, numbers and hyphens",
      ],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"],
      validate: isInteger,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, "Reorder level cannot be negative"],
      validate: isInteger,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, "Supplier name cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: total value of stock held for this product
productSchema.virtual("stockValue").get(function () {
  return Math.round(this.price * this.quantity * 100) / 100;
});

productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

module.exports = mongoose.model("Product", productSchema);
module.exports.CATEGORIES = CATEGORIES;
