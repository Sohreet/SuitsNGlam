// POST /api/admin/products
router.post("/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video } = req.body;

    const product = await Product.create({
      name,
      price,
      pricePerMeter: price,
      category,
      description,
      stock,
      images,
      video,
      addedAt: new Date()
    });

    res.json({ success: true, product });

  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
