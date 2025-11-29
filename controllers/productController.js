// controllers/productController.js
import Product from "../models/Product.js";

/*
|--------------------------------------------------------------------------
| LIST PRODUCTS
| Filters:
| - q = search
| - category = summer/winter/wedding/casuals/dailywear/premiumwear
| - best=true (Best Deals)
| - sale=true (Sales)
| - new=true (New Arrivals last 15 days)
|--------------------------------------------------------------------------
*/
export async function list(req, res) {
  try {
    const q = req.query.q || "";
    const category = req.query.category;
    const filter = {};

    // Search
    if (q) filter.title = new RegExp(q, "i");

    // CATEGORY filter (correct field)
    if (category) filter.category = category;

    // Best deals
    if (req.query.best === "true") filter.isBestDeal = true;

    // Sales
    if (req.query.sale === "true") filter.isSale = true;

    // NEW ARRIVALS (last 15 days)
    if (req.query.new === "true") {
      const since = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: since };
    }

    const prods = await Product.find(filter)
      .limit(500)
      .sort({ createdAt: -1 });

    res.json(prods);

  } catch (err) {
    console.error("LIST ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
*/
export async function get(req, res) {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/
export async function create(req, res) {
  try {
    const body = req.body;

    // Extract images and videos from multer
    const files = req.files || {};

    const images =
      (files.images || []).map(f => f.path) || [];

    const video =
      (files.video && files.video[0]?.path) || null;

    if (!images.length) {
      return res.status(400).json({ error: "At least one image required" });
    }

    const p = await Product.create({
      title: body.title,
      description: body.description,
      price: parseFloat(body.price),
      stock: parseInt(body.stock) || 0,

      // Correct category field
      category: body.category,

      images,
      video,

      minMetres: parseFloat(body.minMetres) || 1,
      maxMetres: parseFloat(body.maxMetres) || 6,

      isBestDeal: body.isBestDeal === "true" || body.isBestDeal === true,
      isSale: body.isSale === "true" || body.isSale === true,
    });

    res.json(p);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/
export async function update(req, res) {
  try {
    const data = req.body;
    const files = req.files || {};

    const updateData = {
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price ? parseFloat(data.price) : undefined,
      stock: data.stock ? parseInt(data.stock) : undefined,
      minMetres: data.minMetres ? parseFloat(data.minMetres) : undefined,
      maxMetres: data.maxMetres ? parseFloat(data.maxMetres) : undefined,
      isBestDeal: data.isBestDeal === "true" || data.isBestDeal === true,
      isSale: data.isSale === "true" || data.isSale === true,
    };

    // New images
    if (files.images?.length) {
      updateData.images = files.images.map(f => f.path);
    }

    // New video
    if (files.video?.length) {
      updateData.video = files.video[0].path;
    }

    const p = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(p);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "update failed" });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/
export async function remove(req, res) {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "delete failed" });
  }
}
