import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Money } from './money.type';

/**
 * A single line item within an order.
 *
 * Mirrors the canonical `OrderItem` type in `graphql/user.graphql`.
 */
@ObjectType()
export class OrderItem {
  @Field(() => ID)
  productId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Money)
  unitPrice!: Money;
}
