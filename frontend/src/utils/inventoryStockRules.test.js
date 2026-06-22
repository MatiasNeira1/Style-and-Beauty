import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STOCK_STATUS,
  calculateInventoryMetrics,
  getStockStatus,
} from './inventoryStockRules.js';

test('clasifica stock cero, bajo, normal, nulo y negativo sin mezclar grupos', () => {
  assert.equal(getStockStatus({ cantidadActual: 0 }), STOCK_STATUS.OUT_OF_STOCK);
  assert.equal(getStockStatus({ cantidadActual: 1 }), STOCK_STATUS.LOW_STOCK);
  assert.equal(getStockStatus({ cantidadActual: 5 }), STOCK_STATUS.LOW_STOCK);
  assert.equal(getStockStatus({ cantidadActual: 6 }), STOCK_STATUS.NORMAL);
  assert.equal(getStockStatus({ cantidadActual: null }), STOCK_STATUS.NO_RECORD);
  assert.equal(getStockStatus({ cantidadActual: -1 }), STOCK_STATUS.INCONSISTENT);
});

test('calcula indicadores solo con productos activos y excluye stock nulo o negativo de bajo/sin stock', () => {
  const products = [
    { idProducto: 'stock-0', activo: true, precio: 1000 },
    { idProducto: 'stock-1', activo: true, precio: 1000 },
    { idProducto: 'stock-5', activo: true, precio: 1000 },
    { idProducto: 'stock-6', activo: true, precio: 1000 },
    { idProducto: 'stock-null', activo: true, precio: 1000 },
    { idProducto: 'stock-negative', activo: true, precio: 1000 },
    { idProducto: 'inactive-stock-0', activo: false, precio: 1000 },
  ];
  const stockRows = [
    { idProducto: 'stock-0', cantidadActual: 0 },
    { idProducto: 'stock-1', cantidadActual: 1 },
    { idProducto: 'stock-5', cantidadActual: 5 },
    { idProducto: 'stock-6', cantidadActual: 6 },
    { idProducto: 'stock-null', cantidadActual: null },
    { idProducto: 'stock-negative', cantidadActual: -3 },
    { idProducto: 'inactive-stock-0', cantidadActual: 0 },
  ];

  const metrics = calculateInventoryMetrics(products, stockRows);

  assert.equal(metrics.totalActiveProducts, 6);
  assert.equal(metrics.outStock.length, 1);
  assert.equal(metrics.lowStock.length, 2);
  assert.equal(metrics.inconsistentStock.length, 1);
  assert.equal(metrics.estimatedValue, 12000);
});
