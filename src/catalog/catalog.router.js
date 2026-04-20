const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/books', async (req, res) => {
  const { q, category } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.name ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const baseQuery = `
      SELECT b.id, b.title, b.author, b.price, b.stock, b.cover_image_key
      FROM catalog.books b
      LEFT JOIN catalog.categories c ON b.category_id = c.id
      ${where}
    `;

    params.push(limit, offset);
    const dataResult = await db.query(
      `${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM catalog.books b LEFT JOIN catalog.categories c ON b.category_id = c.id ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch {
    res.json({ items: [], total: 0, page, limit });
  }
});

module.exports = router;
