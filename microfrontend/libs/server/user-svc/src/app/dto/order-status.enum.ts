import { registerEnumType } from '@nestjs/graphql';

/**
 * Order lifecycle status.
 *
 * Mirrors the canonical `OrderStatus` enum in `graphql/user.graphql` and the
 * `OrderStatus` enum in `prisma/schema.prisma`.
 */
export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });
