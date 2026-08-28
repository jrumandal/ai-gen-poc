import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Money } from './money.type';
import { ProductRef } from './product-ref.type';

/**
 * A single line item in a cart.
 *
 * Mirrors the canonical `CartItem` type in `graphql/cart.graphql`. `unitPrice`
 * is a `Money` (integer cents + currency) to avoid float drift.
 */
@ObjectType()
export class CartItem {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  productId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Money)
  unitPrice!: Money;

  @Field(() => ProductRef)
  product!: ProductRef;
}
