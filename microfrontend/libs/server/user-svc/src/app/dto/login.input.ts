import { Field, InputType } from '@nestjs/graphql';

/**
 * Credentials for the `login` mutation.
 *
 * Mirrors the canonical `LoginInput` in `graphql/user.graphql`.
 */
@InputType()
export class LoginInput {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;
}
