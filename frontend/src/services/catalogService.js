import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  getService: serviceCatalogService.getService,
  listProfessionalsByService: serviceCatalogService.listProfessionalsByService,
  createService: serviceCatalogService.createService,
  updateService: serviceCatalogService.updateService,
  deleteService: serviceCatalogService.deleteService,
  uploadServiceImage: serviceCatalogService.uploadServiceImage,
  deleteServiceImage: serviceCatalogService.deleteServiceImage,
};
