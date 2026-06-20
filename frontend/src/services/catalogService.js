import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  listAllServices: serviceCatalogService.listAllServices,
  getService: serviceCatalogService.getService,
  getCategoryCovers: serviceCatalogService.getCategoryCovers,
  uploadCategoryCover: serviceCatalogService.uploadCategoryCover,
  listProfessionalsByService: serviceCatalogService.listProfessionalsByService,
  listCatalogStaffByService: serviceCatalogService.listCatalogStaffByService,
  assignStaffToService: serviceCatalogService.assignStaffToService,
  removeStaffFromService: serviceCatalogService.removeStaffFromService,
  createService: serviceCatalogService.createService,
  createServiceWithImage: serviceCatalogService.createServiceWithImage,
  updateService: serviceCatalogService.updateService,
  activateService: serviceCatalogService.activateService,
  deactivateService: serviceCatalogService.deactivateService,
  deleteService: serviceCatalogService.deleteService,
  uploadServiceImage: serviceCatalogService.uploadServiceImage,
  deleteServiceImage: serviceCatalogService.deleteServiceImage,
};
