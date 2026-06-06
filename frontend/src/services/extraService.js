import { request } from './apiClient.js';

export const extraService = {
  listExtraBookings: () => request({ url: '/api/extra/citas', authRequired: true }),
  createRequest: (payload) => request({ url: '/api/extra/citas', method: 'POST', authRequired: true, data: payload }),
};
