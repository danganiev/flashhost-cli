import path from 'path';
import fs from 'fs';
import netrc from 'netrc';
import os from 'os';

// let authUtils = (endpoint) => {
//   var host = endpoint.host;
var host = 'flashhost';

var getFile = () => {
  var home = process.env[/^win/.test(process.platform) ? 'USERPROFILE' : 'HOME'];
  return path.join(home, '.netrc');
};

var get = () => {
  try {
    var obj = netrc(getFile());
  } catch (e) {
    var obj = {};
  }

  if (obj.hasOwnProperty(host)) {
    return {
      email: obj[host]['login'],
      token: obj[host]['password'],
    };
  } else {
    return null;
  }
};

var set = (email, token) => {
  var file = getFile();

  try {
    var obj = netrc(file);
  } catch (e) {
    var obj = {};
  }

  if (email === null) {
    delete obj[host];
    fs.writeFileSync(file, netrc.format(obj) + os.EOL);
    return null;
  } else {
    obj[host] = {
      login: email,
      password: token,
    };
    fs.writeFileSync(file, netrc.format(obj) + os.EOL);
    return get();
  }
};

let authUtils = {
  set: set,
  get: get,
};
// };

export default authUtils;
