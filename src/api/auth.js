import prompt from 'prompt';
import gql from 'graphql-tag';
import { each } from 'lodash';
import { format, parse, addDays } from 'date-fns';

import client, { noErrorHandlingClient } from '../apolloClient';
import { processGraphQLError } from '../utils/errors';
import authUtils from '../utils/auth';

prompt.message = '';
prompt.delimiter = '';
// prompt.erro;

const schema = {
  properties: {
    email: {
      required: true,
      description: 'Email',
      pattern: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
      message: 'Неверный формат email',
    },
    password: {
      hidden: true,
      description: 'Пароль',
    },
  },
};

const tryToCreateUser = (email, password) => {
  return client
    .mutate({
      mutation: gql`
        mutation($email: String!, $password: String!) {
          createUser(email: $email, password: $password) {
            token
          }
        }
      `,
      variables: {
        email,
        password,
      },
      errorPolicy: 'none',
    })
    .then((result) => {
      console.log(`Вы успешно создали пользователя и авторизовались`);
      authUtils.set(email, result.data.createUser.token);

      return {
        email,
        token: result.data.createUser.token,
      };
    })
    .catch((e) => {
      processGraphQLError(e);
    });
};

const tryToLogin = (email, password) => {
  return client
    .mutate({
      mutation: gql`
        mutation($email: String!, $password: String!) {
          tokenAuth(email: $email, password: $password) {
            token
          }
        }
      `,
      variables: {
        email,
        password,
      },
      errorPolicy: 'none',
    })
    .then((result) => {
      console.log(`Вы успешно авторизовались`);
      authUtils.set(email, result.data.tokenAuth.token);

      return {
        email,
        token: result.data.tokenAuth.token,
      };
    })
    .catch((e) => {
      if (e.graphQLErrors.length) {
        const gqlErr = e.graphQLErrors[0];
        if (
          gqlErr.extensions &&
          gqlErr.extensions.code === 'SERVER_VALIDATION_ERROR'
        ) {
          console.log('Неверный пароль.');
        } else if (
          gqlErr.extensions &&
          gqlErr.extensions.code === 'USER_DOES_NOT_EXIST_ERROR'
        ) {
          return tryToCreateUser(email, password);
        } else {
          processGraphQLError(e);
        }
      } else {
        processGraphQLError(e);
      }
    });
};

class NotAuthorized extends Error {}

const billingInfo = async (localCreds) => {
  return noErrorHandlingClient
    .query({
      query: gql`
        query {
          billingInfo {
            subscriptionUntil
            canCreateProjects
            tariffId
          }
        }
      `,
    })
    .then((response) => {
      console.log(`Вы авторизованы в качестве ${localCreds.email}`);
      if (response.data.billingInfo) {
        if (response.data.billingInfo.tariffId === 1) {
          console.log('Вы находитесь на пробном периоде');
          const subUntil = parse(
            response.data.billingInfo.subscriptionUntil,
            "yyyy-MM-dd'T'HH:mm:ss",
            new Date()
          );
          console.log(
            `Ваш пробный период истекает ${format(subUntil, 'dd/MM/yyyy')}`
          );
          console.log(
            `Если вы не перейдете на платный тариф, то все ваши сайты будут удалены ${format(
              addDays(subUntil, 14),
              'dd/MM/yyyy'
            )}`
          );
          console.log('Для оплаты сервиса используйте команду flashhost pay');
        } else if (response.data.billingInfo.tariffId === 3) {
          console.log('Вы находитесь на платном тарифе');
          const subUntil = parse(
            response.data.billingInfo.subscriptionUntil,
            "yyyy-MM-dd'T'HH:mm:ss",
            new Date()
          );
          console.log(
            `Ваша подписка истекает ${format(subUntil, 'dd/MM/yyyy')}`
          );
        }
      }

      return response;
    })
    .catch((e) => {
      let isUnauth = false;

      each(e.networkError.result.errors, (value, index) => {
        if (value.extensions.code === 'UNAUTHENTICATED') {
          console.log('Пользователь не авторизован или устарел токен.'.red);
          isUnauth = true;
        }
      });

      if (isUnauth) {
        throw new NotAuthorized();
      }
    });
};

const auth = async (cb, args) => {
  const localCreds = authUtils.get();

  if (localCreds === null) {
    console.log(
      'Создавая аккаунт flashhost, вы соглашаетесь с условиями использования, расположенными по адресу https://flashhost.site/terms'
    );
    console.log('Авторизируйтесь (или создайте аккаунт) введя логин и пароль:');
    prompt.start();
    prompt.get(schema, async function (err, result) {
      if (err) {
        console.log();
        return;
      }
      // Здесь сначала надо попробовать авторизоваться, если аккаунт
      // существует и неверный пароль -- сообщить пользователю
      const loginResult = await tryToLogin(result.email, result.password);
      if (loginResult) {
        try {
          await billingInfo(result);
        } catch (e) {
          authUtils.set(null);
          auth(cb, args);
          return;
        }
        cb(loginResult, args);
      }
    });
  } else {
    try {
      await billingInfo(localCreds);
    } catch (e) {
      authUtils.set(null);
      auth(cb, args);
      return;
    }

    cb(localCreds, args);
  }
};

export default auth;
