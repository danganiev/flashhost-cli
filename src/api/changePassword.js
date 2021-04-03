import prompt from 'prompt';
import gql from 'graphql-tag';

import client from '../apolloClient';
import colors from 'colors';

const schema = {
  properties: {
    oldPassword: {
      required: true,
      description: 'Старый пароль',
      hidden: true,
    },
    newPassword: {
      required: true,
      description: 'Новый пароль',
      hidden: true,
    },
    newPasswordConfirm: {
      required: true,
      description: 'Повторите новый пароль',
      hidden: true,
    },
  },
};

const changePassword = async (args) => {
  console.log('Введите ваш старый пароль:');
  prompt.start();
  prompt.get(schema, async function (err, result) {
    if (err) {
      console.log();
      return;
    }

    if (result.newPassword !== result.newPasswordConfirm) {
      console.log('Новые пароли не совпадают'.red);
      return;
    }

    let res;
    try {
      res = await client.mutate({
        mutation: gql`
          mutation($oldPassword: String!, $newPassword: String!) {
            changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
              success
            }
          }
        `,
        variables: {
          oldPassword: result.oldPassword,
          newPassword: result.newPassword,
        },
        errorPolicy: 'none',
      });

      console.log('Пароль успешно изменен');
    } catch (e) {
      if (e.graphQLErrors.length) {
        let gqlErr = e.graphQLErrors[0];
        if (gqlErr.extensions && gqlErr.extensions.code === 'SERVER_VALIDATION_ERROR') {
          console.log('Неверный старый пароль.'.red);
        }
      }
    }
  });
};

export default changePassword;
