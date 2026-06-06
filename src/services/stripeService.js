import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const createStripePaymentIntent = (amount) => getData(api.post('/api/paiements/stripe/create-payment-intent', { amount }))
