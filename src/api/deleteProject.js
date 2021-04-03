import colors from 'colors';
import read from 'read';
import gql from 'graphql-tag';

import client from '../apolloClient';

const deleteProject = () => {
  read(
    {
      silent: false,
      prompt: '    URL:'.grey,
      default: '',
      edit: true,
    },
    (err, url) => {
      if (url === undefined) {
        console.log();
        console.log('    Удаление проекта отменено.'.red);
      }

      client
        .mutate({
          mutation: gql`
            mutation($urlOrPrefix: String!) {
              deleteProject(urlOrPrefix: $urlOrPrefix)
            }
          `,
          variables: {
            urlOrPrefix: url,
          },
        })
        .then((result) => {
          if (result.errors) {
            console.log('Не удалось удалить проект'.red);
          }
          if (result.data && result.data.deleteProject) {
            console.log('Проект был успешно удален'.green);
          }
        })
        .catch((e) => {
          console.log('Не удалось удалить проект'.red);
        });
    }
  );
};

export default deleteProject;
