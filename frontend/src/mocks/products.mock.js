export const productBrands = [
  ['loreal', "L'Oréal Professionnel", 'Coloración, reparación y styling profesional de salón.', 'https://placehold.co/420x420/f8d7df/7c3a4d?text=L%27Oreal'],
  ['kerastase', 'Kérastase', 'Rutinas capilares premium para brillo, fuerza y nutrición.', 'https://placehold.co/420x420/f4dfc7/6f4f28?text=Kerastase'],
  ['schwarzkopf', 'Schwarzkopf Professional', 'Coloración y cuidado experto para fibra capilar.', 'https://placehold.co/420x420/e9e0d6/3f342e?text=Schwarzkopf'],
  ['wella', 'Wella Professionals', 'Color, tratamientos y acabado profesional.', 'https://placehold.co/420x420/f7c8b9/7f382f?text=Wella'],
  ['cnd', 'CND Nails', 'Productos premium para uñas y cuidado de manos.', 'https://placehold.co/420x420/e9d5ff/59306e?text=CND'],
  ['opi', 'OPI', 'Esmaltes, tratamientos y tonos icónicos para nails.', 'https://placehold.co/420x420/fbcfe8/831843?text=OPI'],
  ['skinceuticals', 'SkinCeuticals', 'Cuidado avanzado de piel con enfoque luminosidad.', 'https://placehold.co/420x420/dbeafe/1e3a8a?text=SkinCeuticals'],
  ['laroche', 'La Roche-Posay', 'Dermocosmética suave para rutinas de piel sensible.', 'https://placehold.co/420x420/e0f2fe/075985?text=LRP'],
  ['moroccanoil', 'Moroccanoil', 'Aceites, máscaras e hidratación capilar con acabado glow.', 'https://placehold.co/420x420/fde68a/7c2d12?text=Moroccanoil'],
  ['olaplex', 'Olaplex', 'Reparación intensiva y cuidado de enlaces capilares.', 'https://placehold.co/420x420/e5e7eb/111827?text=Olaplex'],
].map(([id, nombre, descripcion, logo]) => ({
  id,
  nombre,
  descripcion,
  logo,
}));

const productTemplates = [
  ['Shampoo profesional', 'Cabello', 'Limpieza suave para mantener el resultado de salón.', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=900&q=80'],
  ['Máscara intensiva', 'Tratamiento', 'Nutrición profunda y suavidad desde la primera aplicación.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80'],
  ['Sérum glow', 'Styling', 'Brillo liviano y terminación pulida sin peso.', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80'],
  ['Tratamiento reparador', 'Cuidado', 'Refuerza la fibra y mejora la textura.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80'],
];

const nailTemplates = [
  ['Esmalte profesional', 'Nails', 'Color duradero con acabado brillante.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80'],
  ['Base fortalecedora', 'Nails', 'Cuidado para uñas resistentes y sanas.', 'https://images.unsplash.com/photo-1610992235683-e39b53f2201a?auto=format&fit=crop&w=900&q=80'],
  ['Top coat glow', 'Nails', 'Sellado brillante de larga duración.', 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=80'],
  ['Aceite de cutículas', 'Cuidado', 'Hidratación suave para manos y cutículas.', 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80'],
];

const skincareTemplates = [
  ['Limpiador facial', 'Skincare', 'Limpieza delicada para rutina diaria.', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80'],
  ['Sérum hidratante', 'Skincare', 'Hidratación ligera para piel luminosa.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
  ['Crema reparadora', 'Skincare', 'Confort y nutrición para piel sensible.', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80'],
  ['Protector urbano', 'Skincare', 'Cuidado diario con terminación liviana.', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80'],
];

function templatesForBrand(brandId) {
  if (['cnd', 'opi'].includes(brandId)) return nailTemplates;
  if (['skinceuticals', 'laroche'].includes(brandId)) return skincareTemplates;
  return productTemplates;
}

export const mockProducts = productBrands.flatMap((brand, brandIndex) => (
  templatesForBrand(brand.id).map(([name, category, description, image], index) => ({
    id: `${brand.id}-${index + 1}`,
    nombre: `${name} ${brand.nombre}`,
    marca: brand.nombre,
    marcaId: brand.id,
    categoria: category,
    descripcion: description,
    precio: 12990 + ((brandIndex + index) % 9) * 3500,
    imagenUrl: image,
  }))
));
