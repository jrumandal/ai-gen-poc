import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule, HealthModule, SharedModule } from '@jrumandal/shared';
import { AppController } from './app.controller';
import { UserResolver } from './resolvers/user.resolver';
import { DateTime } from './dto/datetime.type';

@Module({
  imports: [
    AppConfigModule,
    SharedModule,
    HealthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: { path: './dist/schema.gql' },
      playground: true,
      introspection: true,
    }),
  ],
  controllers: [AppController],
  // `DateTime` is a custom GraphQL scalar (see dto/datetime.type.ts).
  // NestJS's `ScalarsExplorerService.getScalarsMap()` discovers `@Scalar`-
  // decorated classes by scanning the module's DI providers. Registering
  // `DateTime` as a provider lets the schema builder resolve
  // `@Field(() => DateTime)` in the `Order` type. (The `resolvers` option is
  // for field resolvers only and does NOT populate the scalarsMap.)
  providers: [UserResolver, DateTime],
})
export class AppModule {}
