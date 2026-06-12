import { memo } from 'react';
import { CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

const currency = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

const benefitMap = {
  cabello: ['Brillo de salon', 'Uso profesional', 'Acabado liviano'],
  tratamiento: ['Nutricion profunda', 'Textura suave', 'Rutina intensiva'],
  styling: ['Control y brillo', 'Sin peso', 'Terminacion pulida'],
  cuidado: ['Confort diario', 'Formula delicada', 'Resultado visible'],
  nails: ['Color duradero', 'Brillo premium', 'Manos cuidadas'],
  skincare: ['Piel luminosa', 'Textura ligera', 'Cuidado diario'],
};

function productId(product) {
  return product.id || product.idProducto || product.nombre;
}

function productName(product) {
  return product.nombre || product.name || product.nombreProducto || 'Producto profesional';
}

function productCategory(product) {
  return product.categoria || 'Cuidado profesional';
}

function productDescription(product) {
  return product.descripcion
    || product.description
    || product.detalle
    || 'Formula profesional disenada para cuidar suavemente, aportar brillo y mantener un acabado ligero desde la primera aplicacion.';
}

function productImage(product) {
  return product.imagenUrl || product.imagen_url || product.imageUrl || product.image;
}

function benefitsFor(product) {
  const category = productCategory(product).toLowerCase();
  return benefitMap[category] || benefitMap.cuidado;
}

export const ProductEditorialShowcase = memo(function ProductEditorialShowcase({ products = [], onAdd }) {
  return (
    <div className="product-editorial-list">
      {products.map((product, index) => {
        const isReversed = index % 2 === 1;
        const name = productName(product);
        const price = product.precio || product.price || product.precio_total || 0;
        const image = productImage(product);

        return (
          <article
            key={productId(product)}
            className={`product-editorial ${isReversed ? 'is-reversed' : ''}`}
          >
            <div className="product-editorial-media">
              <SafeImage src={image} alt={name} />
            </div>

            <div className="product-editorial-copy">
              <span className="product-editorial-kicker"><Sparkles size={15} /> {productCategory(product)}</span>
              <h3>{name}</h3>
              <p>{productDescription(product)}</p>

              <div className="product-editorial-benefits">
                {benefitsFor(product).map((benefit) => (
                  <span key={benefit}><CheckCircle2 size={15} /> {benefit}</span>
                ))}
              </div>

              <div className="product-editorial-actions">
                <strong>{currency.format(price)}</strong>
                <Button
                  type="button"
                  onClick={() => onAdd?.({ ...product, id: productId(product), name, price })}
                >
                  <ShoppingBag size={17} />
                  Agregar
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
});
