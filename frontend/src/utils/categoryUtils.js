export function normalizeCategory(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function categorySlug(value = '') {
  return normalizeCategory(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function groupByCategory(services = []) {
  return services.reduce((acc, service) => {
    const category = service.categoria || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});
}

export function findCategoryBySlug(categories = [], slug = '') {
  return categories.find((category) => categorySlug(category) === slug);
}
