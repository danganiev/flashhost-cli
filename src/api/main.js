import path from 'path';
import read from 'read';
import fs from 'fs';
import colors from 'colors';
import tarr from 'tarr';
import zlib from 'zlib';
import fsReader from 'fstream-ignore';
import FormData from 'form-data';
import fetch from 'node-fetch';
import gql from 'graphql-tag';

import client from '../apolloClient';
import authUtils from '../utils/auth';

import { SERVER_URL } from '../constants';

let createProjectOnServer = async (url) => {
  client
    .mutate({
      mutation: gql`
        mutation($url: String!) {
          createProject(url: $url) {
            id
            urlPrefix
          }
        }
      `,
      variables: {
        url,
      },
    })
    .then((result) => {
      uploadProject(result.data.createProject.id, result.data.createProject.urlPrefix);
    })
    .catch((e) => {
      if (e.graphQLErrors) {
        console.log(e.graphQLErrors[0].message.red);
      } else {
        console.log(e);
      }
    });
};

let uploadProject = async (projectId, urlPrefix) => {
  const form = new FormData();
  form.append('file', fs.createReadStream('project.tar.gz'), {
    filename: 'project.tar.gz',
  });

  form.append('projectId', projectId);
  let result;
  try {
    result = await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: `Token ${authUtils.get().token}`,
      },
    });
    fs.unlink('project.tar.gz', (err) => {});
  } catch (e) {
    console.log(e);
    console.log(e.response);

    console.log('Не удалось опубликовать проект');
    fs.unlink('project.tar.gz', (err) => {});
  }

  if (result.status === 200) {
    if (urlPrefix.includes('.')) {
      console.log(`Проект успешно опубликован. Он доступен по адресу http://${urlPrefix}`);
    } else {
      console.log(
        `Проект успешно опубликован. Он доступен по адресу https://${urlPrefix}.flashhost.site`
      );
    }
  }
};

let zipProject = (path, url) => {
  var project2_ = fsReader({ path, ignoreFiles: ['.flashhostignore'] });

  // we always ignore .git directory
  project2_.addIgnoreRules(['.git', '.*', '*.*~', 'node_modules', 'bower_components']);

  let projectSize = 0;
  project2_.on('child', function (c) {
    // console.log(c);
    fs.lstat(c.path, function (err, stats) {
      projectSize += stats.size;
    });
  });

  project2_.on('end', function () {
    // console.log(projectSize);

    if (projectSize < 499000000) {
      var project_ = fsReader({ path, ignoreFiles: ['.flashhostignore'] });
      project_.addIgnoreRules(['.git', '.*', '*.*~', 'node_modules', 'bower_components']);
      let stream = fs.createWriteStream('project.tar.gz');

      stream.on('error', (err) => {
        console.log(err);
      });

      stream.on('finish', () => {
        createProjectOnServer(url);
      });

      project_.pipe(tarr.Pack()).pipe(zlib.Gzip()).pipe(stream);
    } else {
      console.log(
        'К сожалению на данный момент нельзя публиковать проекты размером более 500 мегабайт'.red
      );
      return;
    }
  });
};

let project = (argPath) => {
  return new Promise((resolve, reject) => {
    var ask = function (defaultPath) {
      read(
        {
          silent: false,
          prompt: '    Проект:'.grey,
          default: defaultPath,
          edit: true,
        },
        function (err, projectPath) {
          if (projectPath === undefined) {
            console.log();
            console.log('    Публикация проекта отменена.'.red);
            reject('Публикация проекта отменена.');
            return;
          }

          if (!fs.existsSync(path.resolve(projectPath))) {
            console.log('   ', 'Пожалуйста введите правильный путь до проекта...'.red);
            //TODO: how the fuck will this even work with promises
            return ask(projectPath);
          } else {
            resolve(path.resolve(projectPath));
          }
        }
      );
    };

    if (argPath) {
      if (!fs.existsSync(path.resolve(argPath))) {
        console.log('   ', 'Введен неправильный путь до проекта.'.red);
        return reject('Публикация проекта отменена.');
      }

      console.log(`    Проект: ${path.resolve(argPath)}`.grey);
      return resolve(path.resolve(argPath));
    }

    var currentPath = path.resolve('./');
    let askResult = ask(path.join(currentPath, path.sep));
    return askResult;
  });
};

const prefixGenerator = () => {
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function baseAlphabet(n) {
    const digits = 'abcdefghijklmnopqrstuvwxyz';

    return digits[n];
  }

  let prefix = '';
  for (let i = 0; i < 5; i++) {
    prefix += baseAlphabet(getRandomInt(0, 25));
  }
  return prefix;
};

let getUrl = (argUrl) => {
  return new Promise((resolve, reject) => {
    var ask = function (defaultUrl) {
      read(
        {
          silent: false,
          prompt: '    URL:'.grey,
          default: defaultUrl,
          edit: true,
        },
        function (err, url) {
          if (url === undefined) {
            console.log();
            console.log('    Публикация проекта отменена.'.red);
            reject('Публикация проекта отменена.');
            return;
          }

          if (url === '') {
            console.log('   ', 'Пожалуйста введите URL'.red);
            return ask(url);
          } else {
            let hasWrongSymbols = false;
            ['/', '+'].forEach((val) => {
              hasWrongSymbols = url.includes(val) || hasWrongSymbols;
            });

            if (hasWrongSymbols) {
              console.log('    URL содержит недопустимые символы (/, +)'.red);
              return ask(url);
            }

            resolve(url);
          }
        }
      );
    };

    if (argUrl) {
      let hasWrongSymbols = false;
      ['/', '+'].forEach((val) => {
        hasWrongSymbols = argUrl.includes(val) || hasWrongSymbols;
      });

      if (hasWrongSymbols) {
        return reject('URL содержит недопустимые символы (/, +)');
      }
      console.log(`    URL: ${argUrl}`.grey);
      return resolve(argUrl);
    }

    let askResult = ask(`${prefixGenerator()}.flashhost.site`);
    return askResult;
  });
};

const main = async (localCreds, args) => {
  let project_,
    url = null;
  try {
    project_ = await project(args._[0]);
    url = await getUrl(args._[1]);
  } catch (e) {
    console.log(e);
    return;
  }
  if (project_ && url) {
    console.log('Идет сжатие и загрузка проекта на сервер...');
    try {
      project_ = zipProject(project_, url);
    } catch (e) {
      console.log(e);
    }
  }
};

export default main;
