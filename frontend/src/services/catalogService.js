import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  getService: serviceCatalogService.getService,
  listProfessionalsByService: serviceCatalogService.listProfessionalsByService,
  listCatalogStaffByService: serviceCatalogService.listCatalogStaffByService,
  assignStaffToService: serviceCatalogService.assignStaffToService,
  removeStaffFromService: serviceCatalogService.removeStaffFromService,
  createService: serviceCatalogService.createService,
  createServiceWithImage: serviceCatalogService.createServiceWithImage,
  updateService: serviceCatalogService.updateService,
  deleteService: serviceCatalogService.deleteService,
  uploadServiceImage: serviceCatalogService.uploadServiceImage,
  deleteServiceImage: serviceCatalogService.deleteServiceImage,
};
