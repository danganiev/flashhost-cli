import colors from 'colors';
import gql from 'graphql-tag';

import client from '../apolloClient';

const pay = (localCreds) => {
  client
    .mutate({
      mutation: gql`
        mutation {
          createOrder
        }
      `,
    })
    .then((result) => {
      console.log(
        `Ссылка на страницу оплаты: https://flashhost.site/payment?order=${result.data.createOrder}&email=${localCreds.email}`
      );
    })
    .catch((e) => {
      console.log(e);
    });
};

export default pay;
