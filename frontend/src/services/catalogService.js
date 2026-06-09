import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  listarServicios: serviceCatalogService.listServices,
  getService: serviceCatalogService.getService,
  obtenerServicio: serviceCatalogService.getService,
  listServicesByCategory: serviceCatalogService.listServicesByCategory,
  listarServiciosPorCategoria: serviceCatalogService.listServicesByCategory,
  createService: serviceCatalogService.createService,
  updateService: serviceCatalogService.updateService,
  deleteService: serviceCatalogService.deleteService,
};
