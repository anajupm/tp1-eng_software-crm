import { createDemoService } from './demo.js';
import { createApiService } from './api.js';

export const dataSource = import.meta.env.VITE_DATA_SOURCE || 'demo';
// Acesso tardio para que bloqueios de localStorage apareçam como erro na tela.
const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const invalidSource = async () => { throw new Error('VITE_DATA_SOURCE deve ser demo ou api.'); };
export const crm = dataSource === 'demo' ? createDemoService(storage)
  : dataSource === 'api' ? createApiService(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000')
    : { load: invalidSource, createOpportunity: invalidSource, changeStage: invalidSource };
