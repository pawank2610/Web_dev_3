const express = require("express");
const c = require("../controllers/productController");
const {
  validateObjectId,
  requireBody,
  validateStockChange,
} = require("../middleware/validate");

const router = express.Router();

router.get("/low-stock", c.getLowStock);
router.get("/summary", c.getCategorySummary);

router.route("/").get(c.getProducts).post(requireBody, c.createProduct);

router.patch(
  "/:id/stock",
  validateObjectId,
  validateStockChange,
  c.adjustStock,
);

router
  .route("/:id")
  .get(validateObjectId, c.getProductById)
  .put(validateObjectId, requireBody, c.updateProduct)
  .delete(validateObjectId, c.deleteProduct);

module.exports = router;
