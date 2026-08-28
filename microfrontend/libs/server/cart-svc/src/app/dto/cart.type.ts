import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CartItem } from './cart-item.type';
import { Money } from './money.type';

/**
 * A shopping cart.
 *
 * Mirrors the canonical `Cart` type in `graphql/cart.graphql`. `subtotal` is a
 * `Money` (integer cents + currency) and `itemCount` is the total quantity
 * across all line items.
 */
@ObjectType()
export class Cart {
  @Field(() => String)
  id!: string;

  @Field(() => [CartItem])
  items!: CartItem[];

  @Field(() => Money)
  subtotal!: Money;

  @Field(() => Int)
  itemCount!: number;
}
