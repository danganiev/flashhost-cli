require('dotenv').config();

const SERVER_URL =
  process.env.IS_DEV === 'true'
    ? 'http://server.flashhost2.site'
    : 'https://server.flashhost.site';

if (process.env.IS_DEV) {
  console.log('Dev mode on');
}

export { SERVER_URL };
