require('dotenv').config();

const SERVER_URL =
  process.env.IS_DEV === 'true'
    ? 'http://server.flashhost2.site'
    : 'https://server.flashhost.site';

console.log(SERVER_URL);

export { SERVER_URL };
