#!/usr/bin/env node
import minimist from 'minimist';

import {
  welcome,
  auth,
  deleteProject,
  list,
  help,
  balance,
  pay,
  logout,
  restorePassword,
  changePassword,
  main as apiMain,
} from './api';

// Apollo client forces warnings, so fuck them
console.warn = () => {};

const main = async () => {
  const args = minimist(process.argv.slice(2));
  const cmd = args._[0];

  switch (cmd) {
    case 'help':
      help();
      break;
    case 'delete':
      if (args.help || args.h) {
        help('delete');
        return;
      }
      auth(deleteProject, args);
      break;
    case 'list':
      if (args.help || args.h) {
        help('list');
        return;
      }
      auth(list, args);
      break;
    // case 'balance':
    //   if (args.help || args.h) {
    //     help('balance');
    //     return;
    //   }
    //   auth(balance);
    //   break;
    case 'pay':
      if (args.help || args.h) {
        help('pay');
        return;
      }
      auth(pay, args);
      break;
    case 'logout':
      if (args.help || args.h) {
        help('logout');
        return;
      }
      logout();
      break;
    case 'restore-password':
      if (args.help || args.h) {
        help('restore-password');
        return;
      }
      restorePassword(args);
      break;
    case 'change-password':
      if (args.help || args.h) {
        help('change-password');
        return;
      }
      auth(changePassword, args);
      break;
    default:
      if (args.help || args.h) {
        help('main');
        return;
      }
      welcome();
      auth(apiMain, args);
  }
};

main();
