import { Field, ObjectType } from '@nestjs/graphql';

/**
 * A lightweight product reference embedded in a cart item.
 *
 * Mirrors the canonical `ProductRef` type in `graphql/cart.graphql`. Only the
 * fields the cart UI needs are exposed (id, name, imageUrl) — the full product
 * lives in the catalog domain.
 */
@ObjectType()
export class ProductRef {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;
}
