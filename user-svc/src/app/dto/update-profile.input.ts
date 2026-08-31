import { Field, InputType } from '@nestjs/graphql';
import { AddressInput } from './address-input.type';

/**
 * Profile update payload for the `updateProfile` mutation.
 *
 * Mirrors the canonical `UpdateProfileInput` in `graphql/user.graphql`.
 */
@InputType()
export class UpdateProfileInput {
  @Field(() => String)
  name!: string;

  @Field(() => AddressInput)
  address!: AddressInput;
}
