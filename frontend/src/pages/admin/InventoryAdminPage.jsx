import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, Edit3, Package, PackagePlus, Plus, Power, PowerOff, Save, Search, Trash2, X } from 'lucide-react';
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
  imagenUrl: '',
  precio: '',
};

const PRODUCT_NAME_MAX_LENGTH = 70;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 180;

const PRODUCT_CATEGORIES = [
  'Cabello',
  'Nails',
  'Cuidados de la piel',
  'Spa',
  'Maquillaje',
];

const initialStockForm = {
  idProducto: '',
  cantidadActual: '',
  unidadMedida: 'unidad',
  stockMinimo: '',
};

function getProductId(product) {
  return product.idProducto || product.id || product.uuid;
}

function productImage(product) {
  return product.imagenUrl || product.imageUrl || product.imagen_url || product.imagen || product.image;
}

function productFormFrom(product) {
  return {
    nombre: String(product.nombre || '').slice(0, PRODUCT_NAME_MAX_LENGTH),
    categoria: product.categoria || '',
    descripcion: String(product.descripcion || '').slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH),
    imagenUrl: productImage(product) || '',
    precio: product.precio ?? '',
  };
}

function ProductFormModal({
  open,
  title,
  form,
  imagePreview,
  imageError,
  categoryError,
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
          <Input
            label="Nombre"
            id="inventory-name"
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Crema hidratante"
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            hint={`${form.nombre.length}/${PRODUCT_NAME_MAX_LENGTH} caracteres`}
            required
          />
          <Input as="select" label="Categoría" id="inventory-category" name="categoria" value={form.categoria} onChange={onChange} error={categoryError} required>
            <option value="">Seleccionar categoría</option>
            {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </Input>
          <Input label="Precio" id="inventory-price" name="precio" type="number" min="0" step="100" value={form.precio} onChange={onChange} placeholder="Precio ($xx.xxx)" required />
          <Input
            as="textarea"
            label="Descripcion"
            id="inventory-description"
            name="descripcion"
            value={form.descripcion}
            onChange={onChange}
            placeholder="Breve descripcion visible para clientes"
            maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
            hint={`${form.descripcion.length}/${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres`}
            rows={3}
          />
        </div>
        <div className="admin-image-field compact">
          <SafeImage src={imagePreview} alt="Imagen del producto" />
          <label className="button button-ghost button-sm staff-file-button">
            <span className="button-content"><Camera size={14} /> Imagen</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageChange(event.target.files?.[0])} />
          </label>
          <span className="admin-modal-hint">
            {isEditing ? 'Puedes conservar la imagen actual. ' : 'La imagen es obligatoria para publicar productos. '}
            Resolución recomendable: 1200 x 1200 px
          </span>
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

function StockFormModal({
  open,
  form,
  products,
  isSaving,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title="Registrar stock inicial" onClose={onClose}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-modal-section form-grid">
          <Input as="select" label="Producto" id="stock-product" name="idProducto" value={form.idProducto} onChange={onChange} required>
            <option value="">Seleccionar producto</option>
            {products.map((product) => <option key={getProductId(product)} value={getProductId(product)}>{product.nombre}</option>)}
          </Input>
          <Input label="Cantidad" id="stock-qty" name="cantidadActual" type="number" min="0" value={form.cantidadActual} onChange={onChange} placeholder="Ej. 12" required />
          <Input label="Unidad" id="stock-unit" name="unidadMedida" value={form.unidadMedida} onChange={onChange} placeholder="unidad, ml, gr" required />
          <Input label="Stock minimo" id="stock-min" name="stockMinimo" type="number" min="0" value={form.stockMinimo} onChange={onChange} placeholder="Ej. 5" />
        </div>
        <p className="admin-modal-hint">Usa este modal solo para cargar la existencia inicial del producto. Los movimientos avanzados se habilitaran cuando existan sucursales.</p>
        {error && <p className="admin-alert">{error.message}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          <Button type="submit" disabled={isSaving}><PackagePlus size={16} /> {isSaving ? 'Registrando...' : 'Registrar stock'}</Button>
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
  onToggleStatus,
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
            {product.activo === true ? (
              <Button type="button" variant="ghost" onClick={() => onToggleStatus(product)} disabled={isMutating}><PowerOff size={16} /> Desactivar</Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => onToggleStatus(product)} disabled={isMutating}><Power size={16} /> Habilitar</Button>
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productImageError, setProductImageError] = useState('');
  const [productCategoryError, setProductCategoryError] = useState('');
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const productsQuery = useQuery({ queryKey: ['inventory-admin'], queryFn: inventoryService.listProducts });
  const stockQuery = useQuery({ queryKey: ['inventory-stock'], queryFn: inventoryService.listStock });

  const products = useMemo(() => (Array.isArray(productsQuery.data) ? productsQuery.data : []), [productsQuery.data]);
  const stockByProduct = useMemo(() => {
    const stockRows = Array.isArray(stockQuery.data) ? stockQuery.data : [];
    return stockRows.reduce((acc, stock) => {
      acc[stock.idProducto] = stock;
      return acc;
    }, {});
  }, [stockQuery.data]);
  const filteredProducts = useMemo(() => {
    const needle = inventorySearch.trim().toLowerCase();
    return products.filter((product) => {
      const productId = getProductId(product);
      const stock = stockByProduct[productId];
      const qty = Number(stock?.cantidadActual ?? 0);
      const min = Number(stock?.stockMinimo ?? 0);
      const haystack = [
        product.nombre,
        product.categoria,
        product.descripcion,
        productId,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = needle ? haystack.includes(needle) : true;
      const matchesCategory = categoryFilter === 'TODAS' ? true : product.categoria === categoryFilter;
      const matchesStatus = statusFilter === 'TODOS'
        ? true
        : statusFilter === 'ACTIVO'
          ? product.activo !== false
          : statusFilter === 'INACTIVO'
            ? product.activo === false
            : statusFilter === 'BAJO_STOCK'
              ? qty <= min
              : qty === 0;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, inventorySearch, products, statusFilter, stockByProduct]);

  const invalidateInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-admin'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
  };

  const applyUpdatedProduct = (updatedProduct) => {
    if (!updatedProduct) return;
    const updatedProductId = getProductId(updatedProduct);
    queryClient.setQueryData(['inventory-admin'], (current) => {
      const currentProducts = Array.isArray(current) ? current : [];
      const exists = currentProducts.some((product) => getProductId(product) === updatedProductId);
      return exists
        ? currentProducts.map((product) => (getProductId(product) === updatedProductId ? updatedProduct : product))
        : [...currentProducts, updatedProduct];
    });
    setSelectedProduct((current) => (
      current && getProductId(current) === updatedProductId ? updatedProduct : current
    ));
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
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setProductImageFile(null);
    setProductImagePreview('');
    setProductImageError('');
    setProductCategoryError('');
  };

  const resetStockModal = () => {
    setStockModalOpen(false);
    setStockForm(initialStockForm);
  };

  const openCreateProduct = () => {
    setSelectedProduct(null);
    setEditingProductId(null);
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setProductImagePreview('');
    setProductImageFile(null);
    setProductImageError('');
    setProductCategoryError('');
    setProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    const existingImageUrl = productImage(product) || '';
    setSelectedProduct(null);
    setEditingProductId(getProductId(product));
    setEditingProduct(product);
    setProductForm({ ...productFormFrom(product), imagenUrl: existingImageUrl });
    setProductImagePreview(existingImageUrl);
    setProductImageFile(null);
    setProductImageError('');
    setProductCategoryError('');
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
    onSuccess: (updatedProduct) => {
      applyUpdatedProduct(updatedProduct);
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
      setStockModalOpen(false);
      invalidateInventory();
    },
  });

  const productStatusMutation = useMutation({
    mutationFn: (product) => (
      product.activo === true
        ? inventoryService.deactivateProduct(getProductId(product))
        : inventoryService.activateProduct(getProductId(product))
    ),
    onSuccess: (updatedProduct) => {
      applyUpdatedProduct(updatedProduct);
      invalidateInventory();
    },
  });
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
      applyUpdatedProduct(updatedProduct);
      invalidateInventory();
    },
  });

  const handleProductSubmit = (event) => {
    event.preventDefault();
    if (productImageError) return;
    const isEditing = Boolean(editingProductId);
    const existingImageUrl = productForm.imagenUrl || productImage(editingProduct) || '';
    const hasExistingImage = Boolean(existingImageUrl || productImagePreview);
    const hasNewImage = Boolean(productImageFile);
    const normalizedPrice = Number(productForm.precio);

    if (!PRODUCT_CATEGORIES.includes(productForm.categoria)) {
      setProductCategoryError('Selecciona una categoría válida.');
      return;
    }
    if ((!isEditing && !hasNewImage) || (isEditing && !hasExistingImage && !hasNewImage)) {
      setProductImageError('La imagen del producto es obligatoria.');
      return;
    }
    setProductCategoryError('');
    const payload = {
      nombre: productForm.nombre.trim(),
      categoria: productForm.categoria,
      descripcion: productForm.descripcion.trim(),
      precio: normalizedPrice,
      ...(isEditing && existingImageUrl ? { imagenUrl: existingImageUrl } : {}),
    };
    saveProductMutation.mutate(payload);
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
  const isMutating = productStatusMutation.isPending || deleteMutation.isPending || productImageMutation.isPending;

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

      <section className="admin-panel compact-panel admin-inventory-actions">
        <header>
          <div>
            <h3>Acciones de inventario</h3>
            <p>Registra stock inicial desde un modal. Los movimientos se habilitaran cuando existan sucursales.</p>
          </div>
          <div className="admin-action-row">
            <Button type="button" size="sm" onClick={() => setStockModalOpen(true)}><PackagePlus size={16} /> Registrar stock inicial</Button>
            <Button type="button" size="sm" variant="secondary" disabled><Save size={16} /> Movimiento de stock - Proximamente</Button>
          </div>
        </header>
      </section>

      <section className="admin-panel compact-panel">
        <header>
          <div>
            <h3>Busqueda y filtros</h3>
            <p>Busca por producto, categoria, descripcion o ID.</p>
          </div>
          {(inventorySearch || categoryFilter !== 'TODAS' || statusFilter !== 'TODOS') && (
            <button
              type="button"
              className="admin-text-button"
              onClick={() => {
                setInventorySearch('');
                setCategoryFilter('TODAS');
                setStatusFilter('TODOS');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </header>
        <div className="admin-local-filter-grid">
          <label className="field admin-search-field">
            <span>Buscar</span>
            <div className="admin-filter-search">
              <Search size={16} />
              <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Producto, categoria o ID" />
            </div>
          </label>
          <Input as="select" label="Categoria" id="inventory-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="TODAS">Todas las categorias</option>
            {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </Input>
          <Input as="select" label="Estado" id="inventory-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="BAJO_STOCK">Bajo stock</option>
            <option value="SIN_STOCK">Sin stock</option>
          </Input>
        </div>
      </section>

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
          rows={filteredProducts}
          emptyMessage="No hay productos registrados. Agrega un producto para comenzar a controlar inventario."
        />
      )}

      <ProductFormModal
        open={productModalOpen}
        title={editingProductId ? 'Editar producto' : 'Agregar producto'}
        form={productForm}
        imagePreview={productImagePreview}
        imageError={productImageError}
        categoryError={productCategoryError}
        isEditing={Boolean(editingProductId)}
        isSaving={saveProductMutation.isPending}
        error={saveProductMutation.error}
        onChange={(event) => {
          const { name, value } = event.target;
          setProductForm((current) => ({ ...current, [name]: value }));
          if (name === 'categoria') setProductCategoryError('');
        }}
        onImageChange={validateAndSetProductImage}
        onClose={resetProductModal}
        onSubmit={handleProductSubmit}
      />

      <StockFormModal
        open={stockModalOpen}
        form={stockForm}
        products={products}
        isSaving={createStockMutation.isPending}
        error={createStockMutation.error}
        onChange={(event) => {
          const { name, value } = event.target;
          setStockForm((current) => ({ ...current, [name]: value }));
        }}
        onClose={resetStockModal}
        onSubmit={(event) => {
          event.preventDefault();
          createStockMutation.mutate(stockForm);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        stock={selectedProduct ? stockByProduct[getProductId(selectedProduct)] : null}
        onClose={() => setSelectedProduct(null)}
        onEdit={openEditProduct}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleStatus={(product) => productStatusMutation.mutate(product)}
        onUploadImage={handleTableProductImageChange}
        isMutating={isMutating}
      />

      {(productImageMutation.isError || productStatusMutation.isError || deleteMutation.isError) && (
        <p className="admin-alert">{productImageMutation.error?.message || productStatusMutation.error?.message || deleteMutation.error?.message}</p>
      )}
    </div>
  );
}
