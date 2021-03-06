let config = {};

if (process.env.NODE_ENV === 'production') {
  config = {
    apiUrl: 'https://api.de.buzzn.net/',
    apiPath: 'api/display',
    secure: true,
    timeout: 60 * 1000,
  };
} else if (process.env.NODE_ENV === 'staging') {
  config = {
    apiUrl: 'https://staging-core.buzzn.io/',
    apiPath: 'api/display',
    secure: true,
    timeout: 60 * 1000,
  };
} else if (process.env.NODE_ENV === 'develop') {
  config = {
    apiUrl: 'https://staging-core.buzzn.io/',
    apiPath: 'api/display',
    secure: true,
    timeout: 60 * 1000,
  };
} else {
  config = {
    apiUrl: 'http://localhost:3000/',
    apiPath: 'api/display',
    secure: false,
    timeout: 60 * 1000,
  };
}

export default config;
