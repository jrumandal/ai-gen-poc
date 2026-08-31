import { GraphQLScalarType, Kind } from 'graphql';
import { Scalar } from '@nestjs/graphql';

/**
 * ISO 8601 date-time scalar.
 *
 * Mirrors the `scalar DateTime` declaration in `graphql/user.graphql`. Values
 * are serialized to / parsed from ISO 8601 strings (e.g. `2026-08-28T12:00:00.000Z`).
 */
@Scalar('DateTime')
export class DateTime extends GraphQLScalarType {
  constructor() {
    super({
      name: 'DateTime',
      description: 'ISO 8601 date-time string.',
      serialize: (value: unknown) => new Date(value as string | number | Date).toISOString(),
      parseValue: (value: unknown) => new Date(value as string | number),
      parseLiteral: (ast) => {
        if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
          return new Date(ast.value);
        }
        return null;
      },
    });
  }
}
