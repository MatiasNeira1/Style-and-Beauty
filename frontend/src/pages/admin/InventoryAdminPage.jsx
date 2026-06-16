import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, Edit3, Package, PackagePlus, Plus, PowerOff, Save, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
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

function productFormFrom(product) {
  return {
    nombre: product.nombre || '',
    categoria: product.categoria || '',
    descripcion: product.descripcion || '',
    precio: product.precio ?? '',
  };
}

function ProductFormModal({
  open,
  title,
  form,
  imagePreview,
  imageError,
  isEditing,
  isSaving,
  error,
  onChange,
  onImageChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-modal-section form-grid">
          <Input label="Nombre" id="inventory-name" name="nombre" value={form.nombre} onChange={onChange} required />
          <Input label="Categoria" id="inventory-category" name="categoria" value={form.categoria} onChange={onChange} required />
          <Input label="Precio" id="inventory-price" name="precio" type="number" min="0" step="100" value={form.precio} onChange={onChange} required />
          <Input label="Descripcion" id="inventory-description" name="descripcion" value={form.descripcion} onChange={onChange} />
        </div>
        <div className="admin-image-field compact">
          <SafeImage src={imagePreview} alt="Imagen del producto" />
          <label className="button button-ghost button-sm staff-file-button">
            <span className="button-content"><Camera size={14} /> Imagen</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageChange(event.target.files?.[0])} />
          </label>
          <span className="admin-modal-hint">{isEditing ? 'Puedes conservar la imagen actual.' : 'La imagen es obligatoria para publicar productos.'}</span>
        </div>
        {imageError && <p className="admin-alert compact">{imageError}</p>}
        {error && <p className="admin-alert">{error.message}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          <Button type="submit" disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Guardando...' : 'Guardar producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ProductDetailModal({
  product,
  stock,
  onClose,
  onEdit,
  onDelete,
  onDeactivate,
  onUploadImage,
  isMutating,
}) {
  return (
    <Modal open={Boolean(product)} title="Detalle del producto" onClose={onClose}>
      {product && (
        <div className="admin-detail-modal">
          <div className="admin-detail-hero with-media">
            <SafeImage src={productImage(product)} alt={product.nombre || 'Producto'} />
            <div>
              <span>{product.categoria || 'Sin categoria'}</span>
              <h3>{product.nombre || 'Producto sin nombre'}</h3>
              <p>{product.descripcion || 'Sin descripcion registrada.'}</p>
            </div>
            <AdminStatusBadge status={product.activo ? 'ACTIVO' : 'INACTIVO'} />
          </div>
          <div className="admin-detail-grid">
            <div><span>Precio</span><strong>{formatCurrencyCLP(product.precio || 0)}</strong></div>
            <div><span>Stock</span><strong>{stock?.cantidadActual ?? 0} {stock?.unidadMedida || 'unidades'}</strong></div>
            <div><span>Minimo</span><strong>{stock?.stockMinimo ?? 0}</strong></div>
            <div><span>ID</span><strong>{getProductId(product)}</strong></div>
          </div>
          <div className="admin-modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button type="button" variant="ghost" onClick={() => onEdit(product)}><Edit3 size={16} /> Editar</Button>
            <label className="button button-ghost staff-file-button">
              <span className="button-content"><Camera size={16} /> Cambiar imagen</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onUploadImage(product, event)} />
            </label>
            {product.activo && (
              <Button type="button" variant="ghost" onClick={() => onDeactivate(getProductId(product))} disabled={isMutating}><PowerOff size={16} /> Desactivar</Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onDelete(getProductId(product))} disabled={isMutating}><Trash2 size={16} /> Eliminar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function InventoryAdminPage() {
  const queryClient = useQueryClient();
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
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

  const resetProductModal = () => {
    setProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setProductImageFile(null);
    setProductImagePreview('');
    setProductImageError('');
  };

  const openCreateProduct = () => {
    setSelectedProduct(null);
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setProductImagePreview('');
    setProductImageFile(null);
    setProductImageError('');
    setProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setSelectedProduct(null);
    setEditingProductId(getProductId(product));
    setProductForm(productFormFrom(product));
    setProductImagePreview(productImage(product) || '');
    setProductImageFile(null);
    setProductImageError('');
    setProductModalOpen(true);
  };

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
        if (productImageFile) {
          return inventoryService.uploadProductImage(editingProductId, productImageFile);
        }
        return savedProduct;
      }
      return inventoryService.createProductWithImage(payload, productImageFile);
    },
    onSuccess: () => {
      resetProductModal();
      invalidateInventory();
    },
  });

  const createStockMutation = useMutation({
    mutationFn: (payload) => inventoryService.createStock({
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
    mutationFn: (payload) => inventoryService.registerMovement({ ...payload, cantidad: Number(payload.cantidad) }),
    onSuccess: () => {
      setMovementForm(initialMovementForm);
      invalidateInventory();
    },
  });

  const deactivateMutation = useMutation({ mutationFn: inventoryService.deactivateProduct, onSuccess: invalidateInventory });
  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteProduct,
    onSuccess: () => {
      setSelectedProduct(null);
      invalidateInventory();
    },
  });
  const productImageMutation = useMutation({
    mutationFn: ({ productId, file }) => inventoryService.uploadProductImage(productId, file),
    onSuccess: (updatedProduct) => {
      setSelectedProduct((current) => (getProductId(current) === getProductId(updatedProduct) ? updatedProduct : current));
      invalidateInventory();
    },
  });

  const handleProductSubmit = (event) => {
    event.preventDefault();
    if (productImageError) return;
    if (!editingProductId && !productImageFile) {
      setProductImageError('Selecciona una imagen para publicar el producto.');
      return;
    }
    saveProductMutation.mutate({ ...productForm, precio: Number(productForm.precio) });
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
  const isMutating = deactivateMutation.isPending || deleteMutation.isPending || productImageMutation.isPending;

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Inventario de productos"
        description="Control de productos, existencias, alertas de bajo stock y movimientos."
        actions={<Button type="button" size="sm" onClick={openCreateProduct}><Plus size={16} /> Agregar producto</Button>}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Package} title="Total productos" value={products.length} trend={0} microcopy="Productos registrados" tone="rose" />
        <AdminKpiCard icon={AlertCircle} title="Bajo stock" value={lowStock.length} trend={lowStock.length ? -8 : 0} microcopy="Reponer con prioridad" tone="gold" />
        <AdminKpiCard icon={PowerOff} title="Sin stock" value={outStock.length} trend={outStock.length ? -12 : 0} microcopy="Stock en cero" tone="ink" />
        <AdminKpiCard icon={PackagePlus} title="Valor estimado" value={formatCurrencyCLP(estimatedValue)} trend={0} microcopy="Precio x cantidad actual" tone="sage" />
      </AdminKpiGrid>

      <div className="grid-list admin-compact-forms">
        <form className="admin-panel" onSubmit={(event) => {
          event.preventDefault();
          createStockMutation.mutate(stockForm);
        }}>
          <h3>Registrar stock inicial</h3>
          <div className="form-grid compact">
            <Input as="select" label="Producto" id="stock-product" name="idProducto" value={stockForm.idProducto} onChange={(event) => setStockForm((current) => ({ ...current, idProducto: event.target.value }))} required>
              <option value="">Seleccionar producto</option>
              {products.map((product) => <option key={getProductId(product)} value={getProductId(product)}>{product.nombre}</option>)}
            </Input>
            <Input label="Cantidad" id="stock-qty" name="cantidadActual" type="number" min="0" value={stockForm.cantidadActual} onChange={(event) => setStockForm((current) => ({ ...current, cantidadActual: event.target.value }))} required />
            <Input label="Unidad" id="stock-unit" name="unidadMedida" value={stockForm.unidadMedida} onChange={(event) => setStockForm((current) => ({ ...current, unidadMedida: event.target.value }))} required />
            <Input label="Stock minimo" id="stock-min" name="stockMinimo" type="number" min="0" value={stockForm.stockMinimo} onChange={(event) => setStockForm((current) => ({ ...current, stockMinimo: event.target.value }))} />
          </div>
          {createStockMutation.isError && <p className="admin-alert">{createStockMutation.error.message}</p>}
          <Button type="submit" disabled={createStockMutation.isPending}><PackagePlus size={16} /> Registrar stock</Button>
        </form>

        <form className="admin-panel" onSubmit={(event) => {
          event.preventDefault();
          movementMutation.mutate(movementForm);
        }}>
          <h3>Movimiento de stock</h3>
          <div className="form-grid compact">
            <Input as="select" label="Producto" id="movement-product" name="idProducto" value={movementForm.idProducto} onChange={(event) => setMovementForm((current) => ({ ...current, idProducto: event.target.value }))} required>
              <option value="">Seleccionar producto</option>
              {products.map((product) => <option key={getProductId(product)} value={getProductId(product)}>{product.nombre}</option>)}
            </Input>
            <Input as="select" label="Tipo" id="movement-type" name="tipoMovimiento" value={movementForm.tipoMovimiento} onChange={(event) => setMovementForm((current) => ({ ...current, tipoMovimiento: event.target.value }))} required>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </Input>
            <Input label="Cantidad" id="movement-qty" name="cantidad" type="number" min="1" value={movementForm.cantidad} onChange={(event) => setMovementForm((current) => ({ ...current, cantidad: event.target.value }))} required />
            <Input label="Motivo" id="movement-reason" name="motivo" value={movementForm.motivo} onChange={(event) => setMovementForm((current) => ({ ...current, motivo: event.target.value }))} />
          </div>
          {movementMutation.isError && <p className="admin-alert">{movementMutation.error.message}</p>}
          <Button type="submit" disabled={movementMutation.isPending}><Save size={16} /> Aplicar movimiento</Button>
        </form>
      </div>

      {isLoading ? (
        <AdminSkeleton rows={5} />
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          compact
          onRowClick={(product) => setSelectedProduct(product)}
          getRowKey={(product) => getProductId(product)}
          getRowLabel={(product) => `Ver detalle de ${product.nombre || 'producto'}`}
          columns={[
            {
              key: 'nombre',
              label: 'Producto',
              render: (row) => (
                <div className="admin-media-cell compact">
                  <SafeImage src={productImage(row)} alt={row.nombre || 'Producto'} />
                  <div className="admin-table-main-cell">
                    <strong>{row.nombre || 'Producto sin nombre'}</strong>
                    <span>{row.descripcion || 'Sin descripcion'}</span>
                  </div>
                </div>
              ),
            },
            { key: 'categoria', label: 'Categoria', render: (row) => row.categoria || 'Sin categoria' },
            { key: 'precio', label: 'Precio', render: (row) => formatCurrencyCLP(row.precio || 0) },
            {
              key: 'stock',
              label: 'Stock',
              render: (row) => {
                const stock = stockByProduct[getProductId(row)];
                const qty = stock?.cantidadActual ?? 0;
                const min = stock?.stockMinimo ?? 0;
                return <span className={qty <= min ? 'admin-table-danger' : ''}>{qty} {stock?.unidadMedida || 'unidades'}</span>;
              },
            },
            { key: 'activo', label: 'Estado', render: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> },
          ]}
          rows={products}
          emptyMessage="No hay productos registrados. Agrega un producto para comenzar a controlar inventario."
        />
      )}

      <ProductFormModal
        open={productModalOpen}
        title={editingProductId ? 'Editar producto' : 'Agregar producto'}
        form={productForm}
        imagePreview={productImagePreview}
        imageError={productImageError}
        isEditing={Boolean(editingProductId)}
        isSaving={saveProductMutation.isPending}
        error={saveProductMutation.error}
        onChange={(event) => {
          const { name, value } = event.target;
          setProductForm((current) => ({ ...current, [name]: value }));
        }}
        onImageChange={validateAndSetProductImage}
        onClose={resetProductModal}
        onSubmit={handleProductSubmit}
      />

      <ProductDetailModal
        product={selectedProduct}
        stock={selectedProduct ? stockByProduct[getProductId(selectedProduct)] : null}
        onClose={() => setSelectedProduct(null)}
        onEdit={openEditProduct}
        onDelete={(id) => deleteMutation.mutate(id)}
        onDeactivate={(id) => deactivateMutation.mutate(id)}
        onUploadImage={handleTableProductImageChange}
        isMutating={isMutating}
      />

      {(productImageMutation.isError || deactivateMutation.isError || deleteMutation.isError) && (
        <p className="admin-alert">{productImageMutation.error?.message || deactivateMutation.error?.message || deleteMutation.error?.message}</p>
      )}
    </div>
  );
}
