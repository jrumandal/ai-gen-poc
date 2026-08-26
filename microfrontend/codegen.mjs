import { join } from 'node:path';

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
const config = {
  schema: join('graphql', 'gateway.graphql'),
  generates: {
    [join('libs', 'shared', 'contracts', 'src', 'generated', 'graphql.ts')]: {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        immutableTypes: true,
        nonOptionalTypename: true,
        avoidOptionals: true,
      },
    },
  },
};

export default config;
