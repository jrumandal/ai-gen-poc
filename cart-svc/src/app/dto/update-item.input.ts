import { Field, InputType, Int } from '@nestjs/graphql';

/**
 * Input for updating the quantity of an existing cart line item.
 *
 * Mirrors the canonical `UpdateItemInput` in `graphql/cart.graphql`.
 */
@InputType()
export class UpdateItemInput {
  @Field(() => Int)
  quantity!: number;
}
