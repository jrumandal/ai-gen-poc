import { Field, ObjectType } from '@nestjs/graphql';

/**
 * A product category (supports a single level of nesting via `parentId`).
 *
 * Mirrors the canonical `Category` type in `graphql/catalog.graphql`.
 */
@ObjectType()
export class Category {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => [Category])
  children!: Category[];
}
