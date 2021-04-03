import colors from 'colors';
import read from 'read';
import gql from 'graphql-tag';
import { map, each } from 'lodash';

import client from '../apolloClient';

const listProjects = () => {
  console.log('Запрашиваем список проектов...');
  client
    .query({
      query: gql`
        query {
          listProjects {
            id
            urlPrefix
          }
        }
      `,
    })
    .then((result) => {
      let urls = map(result.data.listProjects, (value, index) => {
        if (value.urlPrefix.includes('.')) {
          return value.urlPrefix;
        }
        return `${value.urlPrefix}.flashhost.site`;
      });
      each(urls, (value, index) => {
        console.log(value);
      });
      if (urls.length === 0) {
        console.log('У вас нет ни одного проекта');
      }
    })
    .catch((e) => {
      console.log(e);
    });
};

export default listProjects;
