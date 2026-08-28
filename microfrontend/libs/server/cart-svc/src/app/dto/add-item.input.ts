import { Field, InputType, Int } from '@nestjs/graphql';

/**
 * Input for adding (or incrementing) a product in a cart.
 *
 * Mirrors the canonical `AddItemInput` in `graphql/cart.graphql`.
 */
@InputType()
export class AddItemInput {
  @Field(() => String)
  productId!: string;

  @Field(() => Int)
  quantity!: number;
}
