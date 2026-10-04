require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./src/models/Product");

const products = [
  {
    name: "Wireless Mouse",
    sku: "ELEC-MS-101",
    category: "Electronics",
    price: 799,
    quantity: 30,
    reorderLevel: 10,
    supplier: "Logitech India",
  },
  {
    name: "Bluetooth Speaker",
    sku: "ELEC-SP-102",
    category: "Electronics",
    price: 2499,
    quantity: 25,
    reorderLevel: 10,
    supplier: "boAt",
  },
  {
    name: "Smartphone Galaxy M",
    sku: "ELEC-PH-103",
    category: "Electronics",
    price: 14999,
    quantity: 8,
    reorderLevel: 10,
    supplier: "Samsung India",
  },
  {
    name: "USB-C Fast Charger",
    sku: "ELEC-CH-104",
    category: "Electronics",
    price: 599,
    quantity: 33,
    reorderLevel: 15,
    supplier: "Mi India",
  },
  {
    name: "Cotton T-Shirt",
    sku: "APRL-TS-201",
    category: "Apparel",
    price: 499,
    quantity: 50,
    reorderLevel: 20,
    supplier: "Raymond",
  },
  {
    name: "Denim Jeans",
    sku: "APRL-JN-202",
    category: "Apparel",
    price: 1999,
    quantity: 28,
    reorderLevel: 15,
    supplier: "Levis India",
  },
  {
    name: "Study Table",
    sku: "FURN-TB-812",
    category: "Furniture",
    price: 3999,
    quantity: 2,
    reorderLevel: 4,
    supplier: "IKEA India",
  },
  {
    name: "Office Chair",
    sku: "FURN-CH-813",
    category: "Furniture",
    price: 5499,
    quantity: 9,
    reorderLevel: 5,
    supplier: "Godrej Interio",
  },
  {
    name: "Gel Pen Pack of 15",
    sku: "STNY-PN-713",
    category: "Stationery",
    price: 120,
    quantity: 40,
    reorderLevel: 20,
    supplier: "Cello Pens",
  },
  {
    name: "A4 Notebook",
    sku: "STNY-NB-714",
    category: "Stationery",
    price: 85,
    quantity: 12,
    reorderLevel: 25,
    supplier: "Classmate",
  },
  {
    name: "Basmati Rice 5kg",
    sku: "GROC-RC-901",
    category: "Groceries",
    price: 650,
    quantity: 18,
    reorderLevel: 10,
    supplier: "India Gate",
  },
  {
    name: "Olive Oil 1L",
    sku: "GROC-OL-902",
    category: "Groceries",
    price: 899,
    quantity: 3,
    reorderLevel: 8,
    supplier: "Figaro",
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    const created = await Product.insertMany(products);
    console.log(`Seeded ${created.length} products`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
