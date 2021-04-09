import { ApolloClient } from '@apollo/client/core';
import fetch from 'node-fetch';
import { createHttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { InMemoryCache } from '@apollo/client/cache';
import { each } from 'lodash';

import authUtils from './utils/auth';
import { onCatch } from './utils/CatchLink';

import { SERVER_URL } from './constants';

const httpLink = createHttpLink({
  uri: `${SERVER_URL}/graphql`,
  fetch: fetch,
});

const authLink = setContext((request, { headers }) => {
  // get the authentication token from local storage if it exists
  let token = authUtils.get();
  token = token === null ? token : token.token;

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Token ${token}` : '',
    },
  };
});

const authErrorLink = onCatch(({ graphQLErrors, networkError }) => {
  if (networkError && networkError.statusCode === 401) {
    // console.log('Error 401');
    return;
  }

  let isUnauth = false;

  each(graphQLErrors, (value, index) => {
    if (value.extensions.code === 'UNAUTHENTICATED') {
      // console.log('Unauthenticated');
      isUnauth = true;
    }
  });

  if (isUnauth) {
    networkError.isUnauth = true;
    return;
  }
});

const client = new ApolloClient({
  link: authLink.concat(authErrorLink.concat(httpLink)),
  cache: new InMemoryCache(),
});

const noErrorHandlingClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
export { noErrorHandlingClient };
