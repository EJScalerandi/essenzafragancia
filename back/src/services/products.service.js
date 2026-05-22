const { query, withClient } = require('../db/postgres');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapVariant(variant) {
  return {
    color: String(variant.color || ''),
    size: String(variant.size || ''),
    price: toNumber(variant.price),
    stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0,
    ...(variant.compareAtPrice == null ? {} : { compareAtPrice: toNumber(variant.compareAtPrice) }),
  };
}

function mapProduct(row) {
  const variants = Array.isArray(row.variants) ? row.variants : [];
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    image: row.image || '',
    alternateImage: row.alternateImage || row.alternateimage || row.alternate_image || '',
    basePrice: toNumber(row.basePrice ?? row.baseprice ?? row.base_price),
    tags: Array.isArray(row.tags) ? row.tags : [],
    variants: variants.map(mapVariant),
  };
}

const PRODUCT_SELECT = `
  select
    p.id,
    p.name,
    p.category,
    p.description,
    p.image_url as image,
    coalesce(p.alt_image_url, '') as "alternateImage",
    p.base_price as "basePrice",
    p.tags,
    coalesce(
      json_agg(
        json_build_object(
          'color', v.color,
          'size', v.size,
          'price', v.price,
          'stock', v.stock,
          'compareAtPrice', v.compare_at_price
        )
        order by v.sort_order asc, v.id asc
      ) filter (where v.id is not null),
      '[]'::json
    ) as variants
  from public.products p
  left join public.product_variants v on v.product_id = p.id
`;

async function listProducts() {
  const { rows } = await query(
    `${PRODUCT_SELECT}
      where p.active = true
      group by p.id
      order by p.id asc`
  );
  return rows.map(mapProduct);
}

async function getProductById(id) {
  const { rows } = await query(
    `${PRODUCT_SELECT}
      where p.id = $1 and p.active = true
      group by p.id
      limit 1`,
    [id]
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

async function upsertProduct(product) {
  await withClient(async (client) => {
    await client.query(
      `insert into public.products (id, name, category, description, image_url, alt_image_url, base_price, tags, active)
       values ($1, $2, $3, $4, $5, $6, $7, $8::text[], true)
       on conflict (id) do update set
         name = excluded.name,
         category = excluded.category,
         description = excluded.description,
         image_url = excluded.image_url,
         alt_image_url = excluded.alt_image_url,
         base_price = excluded.base_price,
         tags = excluded.tags,
         active = true`,
      [
        product.id,
        product.name,
        product.category,
        product.description || '',
        product.image || '',
        product.alternateImage || '',
        toNumber(product.basePrice),
        Array.isArray(product.tags) ? product.tags : [],
      ]
    );

    await client.query('delete from public.product_variants where product_id = $1', [product.id]);

    const variants = Array.isArray(product.variants) ? product.variants : [];
    for (let i = 0; i < variants.length; i += 1) {
      const variant = variants[i];
      await client.query(
        `insert into public.product_variants (product_id, color, size, price, stock, compare_at_price, sort_order)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.id,
          variant.color,
          variant.size,
          toNumber(variant.price),
          Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0,
          variant.compareAtPrice == null ? null : toNumber(variant.compareAtPrice),
          i + 1,
        ]
      );
    }
  });

  return product;
}

async function updateProductImageFromUpload({ id, kind, fileName, url, mimeType, sizeBytes, buffer }) {
  const existing = await getProductById(id);
  if (!existing) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    err.code = 'NotFound';
    throw err;
  }

  if (kind === 'alt') {
    await query(
      `update public.products
          set alt_image_url = $2,
              alt_image_file_name = $3,
              alt_image_mime_type = $4,
              alt_image_size_bytes = $5,
              alt_image_file_data = $6::bytea
        where id = $1 and active = true`,
      [id, url, fileName, mimeType || 'image/jpeg', sizeBytes || null, buffer]
    );
  } else {
    await query(
      `update public.products
          set image_url = $2,
              image_file_name = $3,
              image_mime_type = $4,
              image_size_bytes = $5,
              image_file_data = $6::bytea
        where id = $1 and active = true`,
      [id, url, fileName, mimeType || 'image/jpeg', sizeBytes || null, buffer]
    );
  }

  return getProductById(id);
}

async function getProductImageFileByName(fileName) {
  const { rows } = await query(
    `select image_file_name as file_name, image_mime_type as mime_type, image_file_data as file_data
       from public.products
      where active = true
        and image_file_name = $1
        and image_file_data is not null
      limit 1`,
    [fileName]
  );

  if (rows[0]) return rows[0];

  const alt = await query(
    `select alt_image_file_name as file_name, alt_image_mime_type as mime_type, alt_image_file_data as file_data
       from public.products
      where active = true
        and alt_image_file_name = $1
        and alt_image_file_data is not null
      limit 1`,
    [fileName]
  );

  return alt.rows[0] || null;
}

async function deleteProduct(id) {
  const { rowCount } = await query(
    `update public.products
        set active = false
      where id = $1 and active = true`,
    [id]
  );
  return { deleted: rowCount > 0 };
}

module.exports = {
  listProducts,
  getProductById,
  upsertProduct,
  updateProductImageFromUpload,
  getProductImageFileByName,
  deleteProduct,
};
