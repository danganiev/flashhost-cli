const help = (topic) => {
  if (!topic) {
    console.log('Доступные команды: ');
    console.log('    flashhost [project] [url]');
    console.log('    flashhost list');
    console.log('    flashhost delete');
    console.log('    flashhost pay');
    console.log('    flashhost logout');
    console.log('    flashhost restore-password');
    console.log('    flashhost change-password');
    console.log('Помощь по командам flashhost --help или flashhost <command> --help');
    return;
  }

  switch (topic) {
    case 'main':
      console.log('Для отображения всех возможных команд введите flashhost help');
      console.log();
      console.log('Публикует или обновляет уже опубликованный проект на flashhost');
      console.log('Использование: flashhost [project] [url]');
      console.log('[project] - прямой или относительный от текущей папки путь до проекта');
      console.log('[url] - желаемый url в виде *.flashhost.site, либо в виде mydomain.com,');
      console.log('если вы хотите использовать свой домен');
      break;
    case 'delete':
      console.log('Удаляет сайт, если он вам принадлежит.');
      console.log('Использование: flashhost delete');
      break;
    case 'list':
      console.log('Отображает список всех сайтов, принадлежащих вам');
      console.log('Использование: flashhost list');
      break;
    // case 'balance':
    //   console.log('Показывает ваш текущий баланс в рублях');
    //   console.log('Использование: flashhost balance');
    //   break;
    case 'pay':
      console.log('Генерирует ссылку на страницу оплаты');
      console.log('Использование: flashhost pay');
      break;

    case 'logout':
      console.log('Удаляет локально хранимые email/токен для входа');
      console.log('Использование: flashhost logout');
      break;

    case 'restore-password':
      console.log('Восстанавливает пароль');
      console.log('Использование: flashhost restore-password <email>');
      break;

    case 'change-password':
      console.log('Меняет пароль');
      console.log('Использование: flashhost change-password');
      break;
  }
};

export default help;
