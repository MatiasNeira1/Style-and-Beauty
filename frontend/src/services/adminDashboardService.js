import { agendaService } from './agendaService.js';
import { catalogService } from './catalogService.js';
import { inventoryService } from './inventoryService.js';
import { paymentService } from './paymentService.js';
import { profileService } from './profileService.js';

export const adminDashboardService = {
  async getSnapshot() {
    const [bookings, services, payments, products, stock, clients, staff] = await Promise.allSettled([
      agendaService.listBookings(),
      catalogService.listServices(),
      paymentService.listTransactions(),
      inventoryService.listProducts(),
      inventoryService.listStock(),
      profileService.listClients(),
      profileService.listStaff(),
    ]);

    return {
      bookings: bookings.status === 'fulfilled' && Array.isArray(bookings.value) ? bookings.value : [],
      services: services.status === 'fulfilled' && Array.isArray(services.value) ? services.value : [],
      payments: payments.status === 'fulfilled' && Array.isArray(payments.value) ? payments.value : [],
      products: products.status === 'fulfilled' && Array.isArray(products.value) ? products.value : [],
      stock: stock.status === 'fulfilled' && Array.isArray(stock.value) ? stock.value : [],
      clients: clients.status === 'fulfilled' && Array.isArray(clients.value) ? clients.value : [],
      staff: staff.status === 'fulfilled' && Array.isArray(staff.value) ? staff.value : [],
      partialErrors: [bookings, services, payments, products, stock, clients, staff].filter((result) => result.status === 'rejected'),
    };
  },
};
