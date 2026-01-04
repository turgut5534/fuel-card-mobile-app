
// export const BASE_URL = 'https://fuelcards.turgutsalgin.com';
export const BASE_URL = 'http://192.168.0.10:3000';

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  PROFILE: `${BASE_URL}/auth/profile`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/changePassword`,
  CARDS: `${BASE_URL}/cards`,
};