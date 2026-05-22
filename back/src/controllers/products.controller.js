const { z } = require('zod');
const { listProducts, getProductById } = require('../services/products.service');
const { getMinPrice } = require('../utils/pricing');

const querySchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'name_asc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = `${p.name} ${p.description} ${p.category} ${(p.tags || []).join(' ')}`.toLowerCase();
  return hay.includes(q);
}

async function list(req, res, next) {
  try {
    const params = querySchema.parse(req.query);
    const q = (params.q || '').trim().toLowerCase();
    const cat = (params.cat || '').trim();
    const tag = (params.tag || '').trim();
    const sort = params.sort || 'relevance';
    const page = params.page || 1;
    const pageSize = params.pageSize || 12;

    let products = await listProducts();

    if (cat) products = products.filter((p) => p.category === cat);
    if (tag) products = products.filter((p) => (p.tags || []).includes(tag));
    if (q) products = products.filter((p) => matchesQuery(p, q));

    const out = [...products];
    if (sort === 'price_asc') out.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    if (sort === 'price_desc') out.sort((a, b) => getMinPrice(b) - getMinPrice(a));
    if (sort === 'name_asc') out.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const total = out.length;
    const start = (page - 1) * pageSize;
    const items = out.slice(start, start + pageSize);

    res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = req.params.id;
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ error: 'NotFound', message: 'Producto no encontrado' });
    return res.json(product);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
