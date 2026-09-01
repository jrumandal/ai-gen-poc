import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule, HealthModule, SharedModule } from '@jrumandal/shared';
import { AppController } from './app.controller';
import { CartResolver } from './resolvers/cart.resolver';

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
  providers: [CartResolver],
})
export class AppModule {}
