import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, Search, Sparkles, Tag } from 'lucide-react';
import { formatCurrencyCLP } from '../../../utils/adminFormatters.js';

function normalize(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getServiceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function getServiceName(service) {
  return service?.nombre || service?.name || 'Servicio';
}

function getServiceCategory(service) {
  return service?.categoria || service?.category || 'Sin categoria';
}

function getServiceDuration(service) {
  return Number(service?.duracion_minutos || service?.duracionMinutos || service?.duracionServicioMin || service?.duracion || 0);
}

function getServicePrice(service) {
  const value = service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.valor ?? service?.monto ?? service?.price;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function formatMinutesDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return '';
  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  return [
    hours > 0 ? `${hours} h` : '',
    remainingMinutes > 0 ? `${remainingMinutes} min` : '',
  ].filter(Boolean).join(' ') || `${rounded} min`;
}

function serviceSearchText(service) {
  return normalize([
    getServiceName(service),
    getServiceCategory(service),
    getServiceDuration(service),
    getServicePrice(service),
  ].filter(Boolean).join(' '));
}

export function ServiceSelectorByCategory({ services = [], selectedValue = '', onSelect }) {
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const grouped = new Map();
    services.forEach((service) => {
      const category = getServiceCategory(service);
      const key = normalize(category) || 'sin-categoria';
      if (!grouped.has(key)) grouped.set(key, { key, name: category, services: [] });
      grouped.get(key).services.push(service);
    });

    return Array.from(grouped.values())
      .map((category) => ({
        ...category,
        services: category.services.slice().sort((a, b) => getServiceName(a).localeCompare(getServiceName(b), 'es')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [services]);

  useEffect(() => {
    if (!selectedValue || activeCategory) return;
    const selectedService = services.find((service) => String(getServiceId(service)) === String(selectedValue));
    if (selectedService) setActiveCategory(normalize(getServiceCategory(selectedService)) || 'sin-categoria');
  }, [activeCategory, selectedValue, services]);

  const normalizedQuery = normalize(query);
  const selectedCategory = categories.find((category) => category.key === activeCategory);

  const visibleCategories = useMemo(() => {
    if (!normalizedQuery) return categories;
    return categories.filter((category) => (
      normalize(category.name).includes(normalizedQuery)
      || category.services.some((service) => serviceSearchText(service).includes(normalizedQuery))
    ));
  }, [categories, normalizedQuery]);

  const visibleServices = useMemo(() => {
    const source = selectedCategory?.services || [];
    if (!normalizedQuery) return source;
    return source.filter((service) => serviceSearchText(service).includes(normalizedQuery));
  }, [normalizedQuery, selectedCategory]);

  const goBackToCategories = () => {
    setActiveCategory('');
    setQuery('');
  };

  return (
    <div className="admin-service-selector">
      <div className="admin-service-selector-toolbar">
        {selectedCategory && (
          <button type="button" className="admin-service-selector-back" onClick={goBackToCategories}>
            <ArrowLeft size={16} />
            Categorias
          </button>
        )}
        <label className="admin-service-selector-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={selectedCategory ? 'Buscar servicio' : 'Buscar categoria o servicio'}
            autoComplete="off"
          />
        </label>
      </div>

      {!selectedCategory ? (
        <div className="admin-service-category-grid">
          {visibleCategories.length ? visibleCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              className="admin-service-category-card"
              onClick={() => {
                setActiveCategory(category.key);
                setQuery('');
              }}
            >
              <span className="admin-service-category-icon"><Sparkles size={18} /></span>
              <strong>{category.name}</strong>
              <small>{category.services.length} servicios disponibles</small>
            </button>
          )) : (
            <p className="admin-service-selector-empty">No hay categorias que coincidan con la busqueda.</p>
          )}
        </div>
      ) : (
        <div className="admin-service-option-list">
          <header className="admin-service-option-heading">
            <div>
              <span>Categoria</span>
              <strong>{selectedCategory.name}</strong>
            </div>
            <small>{visibleServices.length} servicios</small>
          </header>
          {visibleServices.length ? visibleServices.map((service) => {
            const id = getServiceId(service);
            const duration = getServiceDuration(service);
            const price = getServicePrice(service);
            const isSelected = String(id) === String(selectedValue);

            return (
              <button
                key={id}
                type="button"
                className={`admin-service-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelect(id, service)}
              >
                <span className="admin-service-option-main">
                  <strong>{getServiceName(service)}</strong>
                  <small>{getServiceCategory(service)}</small>
                </span>
                <span className="admin-service-option-meta">
                  {duration > 0 && <em><Clock size={13} /> {formatMinutesDuration(duration)}</em>}
                  {price > 0 && <em><Tag size={13} /> {formatCurrencyCLP(price)}</em>}
                </span>
                {isSelected && <Check size={17} className="admin-service-option-check" />}
              </button>
            );
          }) : (
            <p className="admin-service-selector-empty">No hay servicios en esta categoria para la busqueda actual.</p>
          )}
        </div>
      )}
    </div>
  );
}
