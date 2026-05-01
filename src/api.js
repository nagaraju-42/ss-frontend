import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080`;

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

export const api = axios.create({
  baseURL: API_BASE,
});

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-HTTPS local testing where crypto.randomUUID is disabled
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getDeviceId() {
  const key = 'pastry_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = generateId();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}
