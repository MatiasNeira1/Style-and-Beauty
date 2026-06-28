import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, Edit3, Package, PackagePlus, Plus, Power, PowerOff, Save, Search, Trash2, X } from 'lucide-react';
import { AdminPagination } from '../../components/admin/AdminPagination.jsx';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { compareNewestByFields, useAdminPagination } from '../../hooks/useAdminPagination.js';
import { inventoryService } from '../../services/inventoryService.js';
import { formatCurrencyCLP } from '../../utils/adminFormatters.js';
import {
  STOCK_STATUS,
  calculateInventoryMetrics,
  getInventoryProductId as getProductId,
  getStockStatus,
} from '../../utils/inventoryStockRules.js';

const initialProductForm = {
  nombre: '',
  categoria: '',
  descripcion: '',
  imagenUrl: '',
  precio: '',
  stockInicial: '0',
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

function productImage(product) {
  return product?.imagenUrl || product?.imageUrl || product?.imagen_url || product?.imagen || product?.image || '';
}

function productFormFrom(product) {
  return {
    nombre: String(product.nombre || '').slice(0, PRODUCT_NAME_MAX_LENGTH),
    categoria: product.categoria || '',
    descripcion: String(product.descripcion || '').slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH),
    imagenUrl: productImage(product) || '',
    precio: product.precio ?? '',
    stockInicial: '0',
  };
}

function ProductFormModal({
  open,
  title,
  form,
  imagePreview,
  imageError,
  categoryError,
  stockError,
  errorMessage,
  isEditing,
  isSaving,
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
          <Input label="Precio" id="inventory-price" name="precio" type="number" min="0" step="10" value={form.precio} onChange={onChange} placeholder="Precio ($xx.xxx)" required />
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
        {!isEditing && (
          <div className="admin-modal-section admin-initial-stock-section">
            <div>
              <h4>Agregar stock inicial</h4>
              <p>Define la existencia inicial del producto. 0 se considera Sin stock; de 1 a 5 se considera Bajo stock.</p>
            </div>
            <Input
              label="Stock inicial"
              id="inventory-initial-stock"
              name="stockInicial"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.stockInicial}
              onChange={onChange}
              placeholder="0"
              error={stockError}
              hint="Si lo dejas vacio se guardara como 0."
            />
          </div>
        )}
        <div className="admin-image-field compact">
          {imagePreview && <SafeImage src={imagePreview} alt="Imagen del producto" />}
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
        {errorMessage && <p className="admin-alert">{errorMessage}</p>}
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

function CategoryCoverModal({
  open,
  category,
  imagePreview,
  imageError,
  isSaving,
  onImageChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title={`Portada de ${category || 'categoría'}`} onClose={onClose} closeDisabled={isSaving}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-cover-modal-preview">
          {imagePreview ? (
            <SafeImage src={imagePreview} alt={`Portada de ${category}`} />
          ) : (
            <span aria-hidden="true">{category?.slice(0, 1).toUpperCase() || '?'}</span>
          )}
        </div>
        <label className="button button-ghost button-sm staff-file-button">
          <span className="button-content"><Camera size={14} /> Seleccionar imagen</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              onImageChange(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <p className="admin-modal-hint">Resolución recomendable: 1200 x 1200 px</p>
        {imageError && <p className="admin-alert compact">{imageError}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}><X size={16} /> Cerrar</Button>
          <Button type="submit" disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Subiendo...' : 'Guardar portada'}
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
    <Modal open={open} title="Agregar stock" onClose={onClose}>
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
        <p className="admin-modal-hint">Usa este modal para agregar stock a productos existentes que aun no tengan existencia registrada. Los movimientos avanzados se habilitaran cuando existan sucursales.</p>
        {error && <p className="admin-alert">{error.message}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          <Button type="submit" disabled={isSaving}><PackagePlus size={16} /> {isSaving ? 'Guardando...' : 'Guardar stock'}</Button>
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
  imageError,
  isUploadingImage,
  isMutating,
}) {
  const stockStatus = getStockStatus(stock);
  const stockQuantity = stockStatus === STOCK_STATUS.NO_RECORD ? null : Number(stock?.cantidadActual);
  const stockLabel = stockStatus === STOCK_STATUS.NO_RECORD
    ? 'Sin registro'
    : `${stockStatus === STOCK_STATUS.INCONSISTENT ? `Inconsistente: ${stockQuantity}` : stockQuantity} ${stock?.unidadMedida || 'unidades'}`;

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
            <div><span>Stock</span><strong>{stockLabel}</strong></div>
            <div><span>Minimo</span><strong>{stockStatus === STOCK_STATUS.NO_RECORD ? 'Sin registro' : stock?.stockMinimo ?? 0}</strong></div>
            <div><span>ID</span><strong>{getProductId(product)}</strong></div>
          </div>
          <div className="admin-modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button type="button" variant="ghost" onClick={() => onEdit(product)}><Edit3 size={16} /> Editar</Button>
            <label
              className={`button button-ghost staff-file-button${isUploadingImage ? ' is-disabled' : ''}`}
              aria-disabled={isUploadingImage}
            >
              <span className="button-content"><Camera size={16} /> {isUploadingImage ? 'Subiendo imagen...' : 'Cambiar imagen'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => onUploadImage(product, event)}
                disabled={isUploadingImage}
              />
            </label>
            {product.activo === true ? (
              <Button type="button" variant="ghost" onClick={() => onToggleStatus(product)} disabled={isMutating}><PowerOff size={16} /> Desactivar</Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => onToggleStatus(product)} disabled={isMutating}><Power size={16} /> Habilitar</Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onDelete(getProductId(product))} disabled={isMutating}><Trash2 size={16} /> Eliminar</Button>
          </div>
          {imageError && <p className="admin-alert compact">{imageError}</p>}
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
  const [productStockError, setProductStockError] = useState('');
  const [productFormError, setProductFormError] = useState('');
  const [productDetailImageError, setProductDetailImageError] = useState('');
  const [productImageFeedback, setProductImageFeedback] = useState('');
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [coverCategory, setCoverCategory] = useState(null);
  const [categoryCoverFile, setCategoryCoverFile] = useState(null);
  const [categoryCoverPreview, setCategoryCoverPreview] = useState('');
  const [categoryCoverError, setCategoryCoverError] = useState('');

  const productsQuery = useQuery({ queryKey: ['inventory-admin'], queryFn: inventoryService.listProducts });
  const stockQuery = useQuery({ queryKey: ['inventory-stock'], queryFn: inventoryService.listStock });
  const categoryCoversQuery = useQuery({ queryKey: ['category-covers'], queryFn: inventoryService.getCategoryCovers });

  const products = useMemo(() => (Array.isArray(productsQuery.data) ? productsQuery.data : []), [productsQuery.data]);
  const stockRows = useMemo(() => (Array.isArray(stockQuery.data) ? stockQuery.data : []), [stockQuery.data]);
  const inventoryMetrics = useMemo(() => calculateInventoryMetrics(products, stockRows), [products, stockRows]);
  const {
    stockByProduct,
    totalActiveProducts,
    lowStock,
    outStock,
    inconsistentStock,
    estimatedValue,
  } = inventoryMetrics;
  const filteredProducts = useMemo(() => {
    const needle = inventorySearch.trim().toLowerCase();
    return products.filter((product) => {
      const productId = getProductId(product);
      const stock = stockByProduct[productId];
      const stockStatus = getStockStatus(stock);
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
                ? stockStatus === STOCK_STATUS.LOW_STOCK
                : statusFilter === 'SIN_STOCK'
                  ? stockStatus === STOCK_STATUS.OUT_OF_STOCK
                  : stockStatus === STOCK_STATUS.INCONSISTENT;
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort(compareNewestByFields(
      ['updatedAt', 'updated_at', 'fechaActualizacion', 'fecha_actualizacion', 'modifiedAt', 'createdAt', 'created_at', 'fechaCreacion', 'fecha_creacion', 'fechaRegistro'],
      getProductId,
    ));
  }, [categoryFilter, inventorySearch, products, statusFilter, stockByProduct]);
  const hasActiveInventoryFilters = Boolean(inventorySearch || categoryFilter !== 'TODAS' || statusFilter !== 'TODOS');
  const productPagination = useAdminPagination(
    filteredProducts,
    `${inventorySearch}|${categoryFilter}|${statusFilter}`,
  );

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

  const openProductDetail = (product) => {
    setProductDetailImageError('');
    setSelectedProduct(product);
  };

  const closeProductDetail = () => {
    setProductDetailImageError('');
    setSelectedProduct(null);
  };

  useEffect(() => {
    if (!productImageFile) return undefined;
    const objectUrl = URL.createObjectURL(productImageFile);
    setProductImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [productImageFile]);

  useEffect(() => {
    if (!categoryCoverFile) return undefined;
    const objectUrl = URL.createObjectURL(categoryCoverFile);
    setCategoryCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [categoryCoverFile]);

  const categoryCoversByName = useMemo(() => {
    const rows = Array.isArray(categoryCoversQuery.data) ? categoryCoversQuery.data : [];
    return rows.reduce((acc, cover) => {
      if (cover?.categoria) acc[cover.categoria] = cover;
      return acc;
    }, {});
  }, [categoryCoversQuery.data]);

  const openCategoryCover = (category) => {
    setCoverCategory(category);
    setCategoryCoverFile(null);
    setCategoryCoverPreview(categoryCoversByName[category]?.imagenUrl || '');
    setCategoryCoverError('');
  };

  const closeCategoryCover = () => {
    setCoverCategory(null);
    setCategoryCoverFile(null);
    setCategoryCoverPreview('');
    setCategoryCoverError('');
  };

  const validateAndSetCategoryCover = (file) => {
    const currentCoverUrl = categoryCoversByName[coverCategory]?.imagenUrl || '';
    setCategoryCoverError('');
    if (!file) {
      setCategoryCoverFile(null);
      setCategoryCoverPreview(currentCoverUrl);
      setCategoryCoverError('Selecciona una imagen para la portada.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCategoryCoverFile(null);
      setCategoryCoverPreview(currentCoverUrl);
      setCategoryCoverError('Solo se permiten imágenes JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCategoryCoverFile(null);
      setCategoryCoverPreview(currentCoverUrl);
      setCategoryCoverError('La imagen no puede superar 5 MB.');
      return;
    }
    setCategoryCoverFile(file);
  };

  const resetProductModal = () => {
    setProductModalOpen(false);
    setEditingProductId(null);
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setProductImageFile(null);
    setProductImagePreview('');
    setProductImageError('');
    setProductCategoryError('');
    setProductStockError('');
    setProductFormError('');
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
    setProductStockError('');
    setProductFormError('');
    setProductImageFeedback('');
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
    setProductStockError('');
    setProductFormError('');
    setProductImageFeedback('');
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
    onMutate: () => {
      setProductFormError('');
      setProductImageFeedback('');
      return { wasImageUpdate: Boolean(editingProductId && productImageFile) };
    },
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
      if (editingProductId && productImageFile) {
        setProductImageFeedback('Imagen editada correctamente');
      }
      resetProductModal();
      invalidateInventory();
    },
    onError: (_error, _variables, context) => {
      if (context?.wasImageUpdate) {
        setProductFormError('No fue posible editar la imagen del producto');
      }
    },
  });

  const createStockMutation = useMutation({
    mutationFn: (payload) => inventoryService.createStock({
      ...payload,
      cantidadActual: Number(payload.cantidadActual),
      stockMinimo: payload.stockMinimo === '' ? 5 : Number(payload.stockMinimo),
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
    onMutate: () => {
      setProductDetailImageError('');
      setProductImageFeedback('');
    },
    mutationFn: ({ productId, file }) => inventoryService.uploadProductImage(productId, file),
    onSuccess: (updatedProduct) => {
      applyUpdatedProduct(updatedProduct);
      closeProductDetail();
      setProductImageFeedback('Imagen editada correctamente');
      invalidateInventory();
    },
    onError: () => {
      setProductDetailImageError('No fue posible editar la imagen del producto');
    },
  });
  const categoryCoverMutation = useMutation({
    mutationFn: ({ category, file }) => inventoryService.uploadCategoryCover(category, file),
    onSuccess: (updatedCover) => {
      queryClient.setQueryData(['category-covers'], (current) => {
        const covers = Array.isArray(current) ? current : [];
        const exists = covers.some((cover) => cover.categoria === updatedCover.categoria);
        return exists
          ? covers.map((cover) => (cover.categoria === updatedCover.categoria ? updatedCover : cover))
          : [...covers, updatedCover];
      });
      closeCategoryCover();
    },
    onError: (error) => {
      setCategoryCoverError(error.message || 'No se pudo actualizar la portada.');
    },
  });

  const handleProductSubmit = (event) => {
    event.preventDefault();
    if (productImageError) return;
    const isEditing = Boolean(editingProductId);
    const existingImageUrl = isEditing
      ? productForm.imagenUrl || productImage(editingProduct)
      : '';
    const hasExistingImage = Boolean(existingImageUrl || productImagePreview);
    const hasNewImage = Boolean(productImageFile);
    const normalizedPrice = Number(productForm.precio);
    const initialStockValue = productForm.stockInicial === '' ? 0 : Number(productForm.stockInicial);

    if (!PRODUCT_CATEGORIES.includes(productForm.categoria)) {
      setProductCategoryError('Selecciona una categoría válida.');
      return;
    }
    if (!isEditing && (!Number.isInteger(initialStockValue) || initialStockValue < 0)) {
      setProductStockError('Ingresa un numero entero mayor o igual a 0.');
      return;
    }
    if ((!isEditing && !hasNewImage) || (isEditing && !hasExistingImage && !hasNewImage)) {
      setProductImageError('La imagen del producto es obligatoria.');
      return;
    }
    setProductCategoryError('');
    setProductStockError('');
    const payload = {
      nombre: productForm.nombre.trim(),
      categoria: productForm.categoria,
      descripcion: productForm.descripcion.trim(),
      precio: normalizedPrice,
      ...(isEditing && existingImageUrl ? { imagenUrl: existingImageUrl } : {}),
      ...(!isEditing ? { stockInicial: initialStockValue } : {}),
    };
    saveProductMutation.mutate(payload);
  };

  const handleTableProductImageChange = (product, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (productImageMutation.isPending) return;
    if (!file) return;
    productImageMutation.mutate({ productId: getProductId(product), file });
  };

  const handleCategoryCoverSubmit = (event) => {
    event.preventDefault();
    if (!categoryCoverFile) {
      setCategoryCoverError('Selecciona una imagen para la portada.');
      return;
    }
    categoryCoverMutation.mutate({ category: coverCategory, file: categoryCoverFile });
  };

  const isLoading = productsQuery.isLoading || stockQuery.isLoading;
  const isError = productsQuery.isError || stockQuery.isError;
  const error = productsQuery.error || stockQuery.error;
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
        <AdminKpiCard icon={Package} title="Total productos" value={totalActiveProducts} trend={0} microcopy="Productos activos registrados" tone="rose" />
        <AdminKpiCard icon={AlertCircle} title="Bajo stock" value={lowStock.length} trend={lowStock.length ? -8 : 0} microcopy="Reponer con prioridad" tone="gold" />
        <AdminKpiCard icon={PowerOff} title="Sin stock" value={outStock.length} trend={outStock.length ? -12 : 0} microcopy="Stock en cero" tone="ink" />
        <AdminKpiCard icon={PackagePlus} title="Valor estimado" value={formatCurrencyCLP(estimatedValue)} trend={0} microcopy="Precio x cantidad actual" tone="sage" />
      </AdminKpiGrid>

      {inconsistentStock.length > 0 && (
        <p className="admin-alert">
          Se detectaron {inconsistentStock.length} registros con stock negativo. No se cuentan como Bajo stock ni Sin stock; revisa la tabla/API antes de operar inventario.
        </p>
      )}

      {productImageFeedback && (
        <p className="admin-success-alert" role="status" aria-live="polite">{productImageFeedback}</p>
      )}

      <section className="admin-panel compact-panel admin-inventory-actions">
        <header>
          <div>
            <h3>Acciones de inventario</h3>
            <p>Agrega stock a productos existentes. El stock inicial tambien se puede definir al crear un producto.</p>
          </div>
          <div className="admin-action-row">
            <Button type="button" size="sm" onClick={() => setStockModalOpen(true)}><PackagePlus size={16} /> Agregar stock</Button>
            <Button type="button" size="sm" variant="secondary" disabled><Save size={16} /> Movimiento de stock - Proximamente</Button>
          </div>
        </header>
      </section>

      <section className="admin-panel compact-panel admin-category-covers">
        <header>
          <div>
            <h3>Portadas de categorías</h3>
            <p>Imágenes de las tarjetas públicas en /productos. No modifican productos individuales.</p>
          </div>
        </header>
        {categoryCoversQuery.isError && <p className="admin-alert compact">{categoryCoversQuery.error.message}</p>}
        <div className="admin-category-cover-grid">
          {PRODUCT_CATEGORIES.map((category) => {
            const coverUrl = categoryCoversByName[category]?.imagenUrl || '';
            return (
              <article className="admin-category-cover-card" key={category}>
                <div className="admin-category-cover-media">
                  {coverUrl ? (
                    <SafeImage src={coverUrl} alt={`Portada de ${category}`} />
                  ) : (
                    <span aria-hidden="true">{category.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{category}</strong>
                  <span className={coverUrl ? 'admin-cover-status configured' : 'admin-cover-status'}>
                    {coverUrl ? 'Portada configurada' : 'Sin portada configurada'}
                  </span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => openCategoryCover(category)}>
                  <Camera size={14} /> Cambiar portada
                </Button>
              </article>
            );
          })}
        </div>
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
            <option value="INCONSISTENTE">Stock inconsistente</option>
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
          className="admin-list-table-card"
          scrollClassName="admin-list-table-scroll"
          onRowClick={openProductDetail}
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
                const status = getStockStatus(stock);
                if (status === STOCK_STATUS.NO_RECORD) {
                  return <span className="admin-table-muted">Sin registro</span>;
                }
                const qty = Number(stock.cantidadActual);
                const isAlert = status === STOCK_STATUS.OUT_OF_STOCK || status === STOCK_STATUS.LOW_STOCK || status === STOCK_STATUS.INCONSISTENT;
                const label = status === STOCK_STATUS.INCONSISTENT ? `Inconsistente: ${qty}` : qty;
                return <span className={isAlert ? 'admin-table-danger' : ''}>{label} {stock?.unidadMedida || 'unidades'}</span>;
              },
            },
            { key: 'activo', label: 'Estado', render: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> },
          ]}
          rows={productPagination.paginatedItems}
          emptyMessage={hasActiveInventoryFilters ? 'No encontramos resultados con los filtros seleccionados.' : 'No hay productos registrados. Agrega un producto para comenzar a controlar inventario.'}
          toolbar={(
            <AdminPagination
              page={productPagination.page}
              pageSize={productPagination.pageSize}
              totalItems={productPagination.totalItems}
              itemLabel="productos"
              onPageChange={productPagination.setPage}
            />
          )}
        />
      )}

      <ProductFormModal
        open={productModalOpen}
        title={editingProductId ? 'Editar producto' : 'Agregar producto'}
        form={productForm}
        imagePreview={productImagePreview}
        imageError={productImageError}
        categoryError={productCategoryError}
        stockError={productStockError}
        isEditing={Boolean(editingProductId)}
        isSaving={saveProductMutation.isPending}
        errorMessage={productFormError || saveProductMutation.error?.message}
        onChange={(event) => {
          const { name, value } = event.target;
          setProductForm((current) => ({ ...current, [name]: value }));
          if (name === 'categoria') setProductCategoryError('');
          if (name === 'stockInicial') setProductStockError('');
        }}
        onImageChange={validateAndSetProductImage}
        onClose={resetProductModal}
        onSubmit={handleProductSubmit}
      />

      <CategoryCoverModal
        open={Boolean(coverCategory)}
        category={coverCategory}
        imagePreview={categoryCoverPreview}
        imageError={categoryCoverError}
        isSaving={categoryCoverMutation.isPending}
        onImageChange={validateAndSetCategoryCover}
        onClose={closeCategoryCover}
        onSubmit={handleCategoryCoverSubmit}
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
        onClose={closeProductDetail}
        onEdit={openEditProduct}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleStatus={(product) => productStatusMutation.mutate(product)}
        onUploadImage={handleTableProductImageChange}
        imageError={productDetailImageError}
        isUploadingImage={productImageMutation.isPending}
        isMutating={isMutating}
      />

      {(productStatusMutation.isError || deleteMutation.isError) && (
        <p className="admin-alert">{productStatusMutation.error?.message || deleteMutation.error?.message}</p>
      )}
    </div>
  );
}
