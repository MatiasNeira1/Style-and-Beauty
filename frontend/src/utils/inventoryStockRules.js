export const LOW_STOCK_LIMIT = 5;

export const STOCK_STATUS = {
  NO_RECORD: 'NO_RECORD',
  INCONSISTENT: 'INCONSISTENT',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  NORMAL: 'NORMAL',
};

export function getInventoryProductId(product) {
  return product?.idProducto || product?.id || product?.uuid;
}

export function isActiveInventoryProduct(product) {
  return product?.activo !== false;
}

export function mapStockByProduct(stockRows = []) {
  return stockRows.reduce((acc, stock) => {
    if (stock?.idProducto) acc[stock.idProducto] = stock;
    return acc;
  }, {});
}

export function getStockQuantity(stock) {
  const rawValue = stock?.cantidadActual;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const quantity = Number(rawValue);
  return Number.isFinite(quantity) ? quantity : null;
}

export function getStockStatus(stock) {
  const quantity = getStockQuantity(stock);
  if (quantity === null) return STOCK_STATUS.NO_RECORD;
  if (quantity < 0) return STOCK_STATUS.INCONSISTENT;
  if (quantity === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (quantity >= 1 && quantity <= LOW_STOCK_LIMIT) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.NORMAL;
}

export function isOutOfStock(stock) {
  return getStockStatus(stock) === STOCK_STATUS.OUT_OF_STOCK;
}

export function isLowStock(stock) {
  return getStockStatus(stock) === STOCK_STATUS.LOW_STOCK;
}

export function isInconsistentStock(stock) {
  return getStockStatus(stock) === STOCK_STATUS.INCONSISTENT;
}

export function calculateInventoryMetrics(products = [], stockRows = []) {
  const stockByProduct = mapStockByProduct(stockRows);
  const activeProducts = products.filter(isActiveInventoryProduct);
  const activeStockRows = activeProducts
    .map((product) => stockByProduct[getInventoryProductId(product)])
    .filter(Boolean);

  const lowStock = activeStockRows.filter(isLowStock);
  const outStock = activeStockRows.filter(isOutOfStock);
  const inconsistentStock = activeStockRows.filter(isInconsistentStock);

  const estimatedValue = activeProducts.reduce((sum, product) => {
    const quantity = getStockQuantity(stockByProduct[getInventoryProductId(product)]);
    const safeQuantity = quantity && quantity > 0 ? quantity : 0;
    return sum + Number(product.precio || 0) * safeQuantity;
  }, 0);

  return {
    activeProducts,
    totalActiveProducts: activeProducts.length,
    lowStock,
    outStock,
    inconsistentStock,
    estimatedValue,
    stockByProduct,
  };
}
