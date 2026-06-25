import api from './api';

export const detectOperator = async (phone) => {
  const response = await api.post('/api/maishapay/detect-operator', { phone });
  return response.data;
};

export const purchaseAirtime = async (phone, amount, operatorId) => {
  const response = await api.post('/api/maishapay/purchase-airtime', { phone, amount, operatorId });
  return response.data;
};

export const getCheckoutData = async (amount, devise = 'CDF', callbackUrl = '') => {
  const response = await api.post('/api/maishapay/checkout-data', { amount, devise, callbackUrl });
  return response.data;
};
