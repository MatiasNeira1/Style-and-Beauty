import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, Edit3, Image as ImageIcon, Package, PackagePlus, PowerOff, Save, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { inventoryService } from '../../services/inventoryService.js';
import { formatCurrencyCLP } from '../../utils/adminFormatters.js';

const initialProductForm = {
  nombre: '',
  categoria: '',
  descripcion: '',
  precio: '',
};

const initialStockForm = {
  idProducto: '',
  cantidadActual: '',
  unidadMedida: 'unidad',
  stockMinimo: '',
};

const initialMovementForm = {
  idProducto: '',
  tipoMovimiento: 'ENTRADA',
  cantidad: '',
  motivo: '',
};

function getProductId(product) {
  return product.idProducto || product.id || product.uuid;
}

function productImage(product) {
  return product.imagenUrl || product.imageUrl || product.imagen_url || product.imagen || product.image;
}

export function InventoryAdminPage() {
  const queryClient = useQueryClient();
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productImageError, setProductImageError] = useState('');
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [movementForm, setMovementForm] = useState(initialMovementForm);

  const productsQuery = useQuery({ queryKey: ['inventory-admin'], queryFn: inventoryService.listProducts });
  const stockQuery = useQuery({ queryKey: ['inventory-stock'], queryFn: inventoryService.listStock });

  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];
  const stockByProduct = useMemo(() => {
    const stockRows = Array.isArray(stockQuery.data) ? stockQuery.data : [];
    return stockRows.reduce((acc, stock) => {
      acc[stock.idProducto] = stock;
      return acc;
    }, {});
  }, [stockQuery.data]);

  const invalidateInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-admin'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
  };

  useEffect(() => {
    if (!productImageFile) return undefined;
    const objectUrl = URL.createObjectURL(productImageFile);
    setProductImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [productImageFile]);

  const validateAndSetProductImage = (file) => {
    setProductImageError('');
    if (!file) {
      setProductImageFile(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProductImageFile(null);
      setProductImageError('Solo se permiten imagenes JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProductImageFile(null);
      setProductImageError('La imagen no puede superar 5 MB.');
      return;
    }
    setProductImageFile(file);
  };

  const saveProductMutation = useMutation({
    mutationFn: async (payload) => {
      let savedProduct;
      if (editingProductId) {
        savedProduct = await inventoryService.updateProduct(editingProductId, payload);
      } else {
        savedProduct = await inventoryService.createProduct(payload);
      }

      if (productImageFile) {
        return inventoryService.uploadProductImage(getProductId(savedProduct) || editingProductId, productImageFile);
      }

      return savedProduct;
    },
    onSuccess: () => {
      setProductForm(initialProductForm);
      setEditingProductId(null);
      setProductImageFile(null);
      setProductImagePreview('');
      setProductImageError('');
      invalidateInventory();
    },
  });

  const createStockMutation = useMutation({
    mutationFn: (payload) =>
      inventoryService.createStock({
        ...payload,
        cantidadActual: Number(payload.cantidadActual),
        stockMinimo: payload.stockMinimo === '' ? 0 : Number(payload.stockMinimo),
      }),
    onSuccess: () => {
      setStockForm(initialStockForm);
      invalidateInventory();
    },
  });

  const movementMutation = useMutation({
    mutationFn: (payload) =>
      inventoryService.registerMovement({
        ...payload,
        cantidad: Number(payload.cantidad),
      }),
    onSuccess: () => {
      setMovementForm(initialMovementForm);
      invalidateInventory();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: inventoryService.deactivateProduct,
    onSuccess: invalidateInventory,
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteProduct,
    onSuccess: invalidateInventory,
  });

  const productImageMutation = useMutation({
    mutationFn: ({ productId, file }) => inventoryService.uploadProductImage(productId, file),
    onSuccess: invalidateInventory,
  });

  const deleteProductImageMutation = useMutation({
    mutationFn: inventoryService.deleteProductImage,
    onSuccess: invalidateInventory,
  });

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const handleStockChange = (event) => {
    const { name, value } = event.target;
    setStockForm((current) => ({ ...current, [name]: value }));
  };

  const handleMovementChange = (event) => {
    const { name, value } = event.target;
    setMovementForm((current) => ({ ...current, [name]: value }));
  };

  const handleProductSubmit = (event) => {
    event.preventDefault();
    if (productImageError) return;
    saveProductMutation.mutate({
      ...productForm,
      precio: Number(productForm.precio),
    });
  };

  const handleStockSubmit = (event) => {
    event.preventDefault();
    createStockMutation.mutate(stockForm);
  };

  const handleMovementSubmit = (event) => {
    event.preventDefault();
    movementMutation.mutate(movementForm);
  };

  const startEditing = (product) => {
    setEditingProductId(getProductId(product));
    setProductImageFile(null);
    setProductImagePreview(productImage(product) || '');
    setProductImageError('');
    setProductForm({
      nombre: product.nombre || '',
      categoria: product.categoria || '',
      descripcion: product.descripcion || '',
      precio: product.precio ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setProductImageFile(null);
    setProductImagePreview('');
    setProductImageError('');
  };

  const handleTableProductImageChange = (product, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    productImageMutation.mutate({ productId: getProductId(product), file });
  };

  const isLoading = productsQuery.isLoading || stockQuery.isLoading;
  const isError = productsQuery.isError || stockQuery.isError;
  const error = productsQuery.error || stockQuery.error;
  const stockRows = Array.isArray(stockQuery.data) ? stockQuery.data : [];
  const lowStock = stockRows.filter((stock) => Number(stock.cantidadActual || 0) <= Number(stock.stockMinimo || 0));
  const outStock = stockRows.filter((stock) => Number(stock.cantidadActual || 0) === 0);
  const estimatedValue = products.reduce((sum, product) => {
    const qty = stockByProduct[getProductId(product)]?.cantidadActual || 0;
    return sum + Number(product.precio || 0) * Number(qty);
  }, 0);

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Inventario de productos"
        description="Control de productos, existencias, alertas de bajo stock y movimientos."
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Package} title="Total productos" value={products.length} trend={6} microcopy="Productos registrados" tone="rose" />
        <AdminKpiCard icon={AlertCircle} title="Bajo stock" value={lowStock.length} trend={lowStock.length ? -8 : 0} microcopy="Reponer con prioridad" tone="gold" />
        <AdminKpiCard icon={PowerOff} title="Sin stock" value={outStock.length} trend={outStock.length ? -12 : 0} microcopy="Stock en cero" tone="ink" />
        <AdminKpiCard icon={PackagePlus} title="Valor estimado" value={formatCurrencyCLP(estimatedValue)} trend={4} microcopy="Precio x cantidad actual" tone="sage" />
      </AdminKpiGrid>

      <form className="admin-panel" onSubmit={handleProductSubmit}>
        <h3>{editingProductId ? 'Editar producto' : 'Crear producto'}</h3>
        <div className="form-grid">
          <Input label="Nombre" id="inventory-name" name="nombre" value={productForm.nombre} onChange={handleProductChange} required />
          <Input label="Categoria" id="inventory-category" name="categoria" value={productForm.categoria} onChange={handleProductChange} required />
          <Input label="Precio" id="inventory-price" name="precio" type="number" min="0" step="100" value={productForm.precio} onChange={handleProductChange} required />
          <Input label="Descripcion" id="inventory-description" name="descripcion" value={productForm.descripcion} onChange={handleProductChange} />
        </div>
        <div className="admin-image-field">
          <SafeImage src={productImagePreview} alt="Imagen del producto" />
          <label className="button button-ghost button-sm staff-file-button">
            <span className="button-content"><Camera size={14} /> Imagen</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => validateAndSetProductImage(event.target.files?.[0])} />
          </label>
          {productImageError && <p className="admin-alert compact">{productImageError}</p>}
        </div>
        {saveProductMutation.isError && <p className="admin-alert">{saveProductMutation.error.message}</p>}
        {(productImageMutation.isError || deleteProductImageMutation.isError) && <p className="admin-alert">{productImageMutation.error?.message || deleteProductImageMutation.error?.message}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saveProductMutation.isPending}>
            <Save size={16} />
            {saveProductMutation.isPending ? 'Guardando...' : editingProductId ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          {editingProductId && (
            <Button type="button" variant="ghost" onClick={cancelEditing}>
              <X size={16} />
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="grid-list">
        <form className="admin-panel" onSubmit={handleStockSubmit}>
          <h3>Registrar stock inicial</h3>
          <div className="form-grid">
            <Input as="select" label="Producto" id="stock-product" name="idProducto" value={stockForm.idProducto} onChange={handleStockChange} required>
              <option value="">Seleccionar producto</option>
              {products.map((product) => (
                <option key={getProductId(product)} value={getProductId(product)}>
                  {product.nombre}
                </option>
              ))}
            </Input>
            <Input label="Cantidad" id="stock-qty" name="cantidadActual" type="number" min="0" value={stockForm.cantidadActual} onChange={handleStockChange} required />
            <Input label="Unidad" id="stock-unit" name="unidadMedida" value={stockForm.unidadMedida} onChange={handleStockChange} required />
            <Input label="Stock minimo" id="stock-min" name="stockMinimo" type="number" min="0" value={stockForm.stockMinimo} onChange={handleStockChange} />
          </div>
          {createStockMutation.isError && <p className="admin-alert">{createStockMutation.error.message}</p>}
          <Button type="submit" disabled={createStockMutation.isPending}>
            <PackagePlus size={16} />
            {createStockMutation.isPending ? 'Registrando...' : 'Registrar stock'}
          </Button>
        </form>

        <form className="admin-panel" onSubmit={handleMovementSubmit}>
          <h3>Movimiento de stock</h3>
          <div className="form-grid">
            <Input as="select" label="Producto" id="movement-product" name="idProducto" value={movementForm.idProducto} onChange={handleMovementChange} required>
              <option value="">Seleccionar producto</option>
              {products.map((product) => (
                <option key={getProductId(product)} value={getProductId(product)}>
                  {product.nombre}
                </option>
              ))}
            </Input>
            <Input as="select" label="Tipo" id="movement-type" name="tipoMovimiento" value={movementForm.tipoMovimiento} onChange={handleMovementChange} required>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </Input>
            <Input label="Cantidad" id="movement-qty" name="cantidad" type="number" min="1" value={movementForm.cantidad} onChange={handleMovementChange} required />
            <Input label="Motivo" id="movement-reason" name="motivo" value={movementForm.motivo} onChange={handleMovementChange} />
          </div>
          {movementMutation.isError && <p className="admin-alert">{movementMutation.error.message}</p>}
          <Button type="submit" disabled={movementMutation.isPending}>
            <Save size={16} />
            {movementMutation.isPending ? 'Aplicando...' : 'Aplicar movimiento'}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <AdminSkeleton rows={5} />
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'nombre',
              label: 'Producto',
              render: (row) => (
                <div className="admin-media-cell">
                  <SafeImage src={productImage(row)} alt={row.nombre || 'Producto'} />
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{row.nombre || 'Producto sin nombre'}</span>
                    {row.descripcion && <span className="text-xs text-ink-soft font-normal max-w-sm truncate">{row.descripcion}</span>}
                  </div>
                </div>
              ),
            },
            {
              key: 'categoria',
              label: 'Categoria',
              render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d7ad66]/10 text-[#a87d32] border border-[#d7ad66]/20">
                  {row.categoria || 'Sin categoria'}
                </span>
              ),
            },
            {
              key: 'precio',
              label: 'Precio',
              render: (row) => (
                <span className="text-ink font-bold">
                  {formatCurrencyCLP(row.precio || 0)}
                </span>
              ),
            },
            {
              key: 'stock',
              label: 'Stock',
              render: (row) => {
                const stock = stockByProduct[getProductId(row)];
                const qty = stock?.cantidadActual ?? 0;
                const min = stock?.stockMinimo ?? 0;
                const isLow = qty <= min;
                return (
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {isLow ? (
                      <span className="flex items-center gap-1 text-primary">
                        <AlertCircle size={14} />
                        <span>{qty} {stock?.unidadMedida || 'unidades'}</span>
                      </span>
                    ) : (
                      <span className="text-sage">{qty} {stock?.unidadMedida || 'unidades'}</span>
                    )}
                  </div>
                );
              },
            },
            { key: 'activo', label: 'Estado', render: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (row) => {
                const productId = getProductId(row);
                return (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEditing(row)}>
                      <Edit3 size={14} />
                      Editar
                    </Button>
                    <label className="button button-ghost button-sm staff-file-button">
                      <span className="button-content"><Camera size={14} /> Imagen</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleTableProductImageChange(row, event)} />
                    </label>
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteProductImageMutation.mutate(productId)} disabled={deleteProductImageMutation.isPending || !productImage(row)}>
                      <ImageIcon size={14} />
                      Quitar
                    </Button>
                    {row.activo && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => deactivateMutation.mutate(productId)} disabled={deactivateMutation.isPending}>
                        <PowerOff size={14} />
                        Desactivar
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteMutation.mutate(productId)} disabled={deleteMutation.isPending}>
                      <Trash2 size={14} />
                      Eliminar
                    </Button>
                  </div>
                );
              },
            },
          ]}
          rows={products}
          emptyMessage="No hay productos registrados. Crea un producto para comenzar a controlar inventario."
        />
      )}
    </div>
  );
}
