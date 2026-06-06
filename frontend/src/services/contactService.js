import { request } from './apiClient.js';

export const contactService = {
  sendMessage: (payload) =>
    request({
      url: '/api/contact',
      method: 'POST',
      authRequired: true,
      data: payload,
    }),
};
