import { request } from './apiClient.js';

export const extraService = {
  listExtraBookings: () => request({ url: '/api/extra/citas' }),
  createRequest: (payload) => request({ url: '/api/extra/citas', method: 'POST', data: payload }),
};
