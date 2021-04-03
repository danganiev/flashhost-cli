import colors from 'colors';
import read from 'read';
import gql from 'graphql-tag';
import { map, each } from 'lodash';

import client from '../apolloClient';

const balance = (localCreds) => {
  console.log('Узнаем баланс...');
  client
    .query({
      query: gql`
        query {
          getBalance
        }
      `,
    })
    .then((result) => {
      console.log(`Ваш баланс: ${result.data.getBalance} ₽`);
    })
    .catch((e) => {
      console.log(e);
    });
};

export default balance;
