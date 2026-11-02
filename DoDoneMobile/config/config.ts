/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

// Development configuration
// const USE_HTTPS = false; 
// const BASE_HOST = "192.168.1.126"; 
// const HTTP_PORT = "5214";
// const HTTPS_PORT = "5215";
// const API_BASE_URL = USE_HTTPS 
//   ? `https://${BASE_HOST}:${HTTPS_PORT}`
//   : `http://${BASE_HOST}:${HTTP_PORT}`;


// const BASE_CLIENT = "192.168.1.126"; 
// const CLIENT_HTTP_PORT = "5173";
// const CLIENT_HTTPS_PORT = "5174"; 

// const CLIENT_BASE_URL = USE_HTTPS
//   ? `https://${BASE_CLIENT}:${CLIENT_HTTPS_PORT}`
//   : `http://${BASE_CLIENT}:${CLIENT_HTTP_PORT}`;

// Production configuration
const USE_HTTPS = true;
const BASE_HOST = "dodone-server-333732290566.us-east1.run.app"; 
const API_BASE_URL = `https://${BASE_HOST}`

const BASE_CLIENT = "dodoneapp.com"; 

const CLIENT_BASE_URL = USE_HTTPS
  ? `https://${BASE_CLIENT}`
  : `http://${BASE_CLIENT}`;


export default {
  API_BASE_URL,
  USE_HTTPS,
  CLIENT_BASE_URL
};
