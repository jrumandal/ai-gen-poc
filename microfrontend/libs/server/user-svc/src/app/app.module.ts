import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule, HealthModule, SharedModule } from '@server/shared';
import { AppController } from './app.controller';
import { UserResolver } from './resolvers/user.resolver';

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
  providers: [UserResolver],
})
export class AppModule {}
