import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateTime } from './datetime.type';
import { Money } from './money.type';
import { OrderItem } from './order-item.type';
import { OrderStatus } from './order-status.enum';

/**
 * A user order with its line items.
 *
 * Mirrors the canonical `Order` type in `graphql/user.graphql`.
 */
@ObjectType()
export class Order {
  @Field(() => ID)
  id!: string;

  @Field(() => DateTime)
  createdAt!: Date;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => [OrderItem])
  items!: OrderItem[];

  @Field(() => Money)
  total!: Money;
}
