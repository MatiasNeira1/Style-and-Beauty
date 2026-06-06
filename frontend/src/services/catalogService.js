import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  createService: serviceCatalogService.createService,
  updateService: serviceCatalogService.updateService,
  deleteService: serviceCatalogService.deleteService,
};
