import { Args, ID, Mutation, Query } from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/shared';
import { AddItemInput } from '../dto/add-item.input';
import { Cart } from '../dto/cart.type';
import { CartItem } from '../dto/cart-item.type';
import { ProductRef } from '../dto/product-ref.type';
import { UpdateItemInput } from '../dto/update-item.input';

/**
 * Cart GraphQL resolver.
 *
 * Backed by Prisma (real DB) — see `prisma/schema.prisma`. The cart domain is
 * read + write: `cart` query and `addItemToCart` / `updateCartItem` /
 * `removeItemFromCart` / `clearCart` mutations.
 *
 * Money is stored as integer cents (`unitPrice`) + `currency` in the DB and
 * mapped to the `Money` GraphQL type (`amount` + `currency`).
 */

/** Shape of a Prisma `CartItem` row with its nested product. */
type CartItemRow = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

/** Shape of a Prisma `Cart` row with its nested items. */
type CartRow = {
  id: string;
  items: CartItemRow[];
};

@Injectable()
export class CartResolver {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch a cart by id (or null if not found).
   */
  @Query(() => Cart, {
    nullable: true,
    description: 'Fetch a cart by id.',
  })
  async cart(@Args('cartId', { type: () => ID }) cartId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });

    return row ? this.toCart(row) : null;
  }

  /**
   * Fetch the cart owned by a user (or null if the user has no cart).
   *
   * This lets the storefront resolve the active cart from the signed-in user
   * (e.g. `me { id }` → `cartForUser(userId)`) without hard-coding a cart id.
   */
  @Query(() => Cart, {
    nullable: true,
    description: 'Fetch the cart owned by a user.',
  })
  async cartForUser(@Args('userId', { type: () => ID }) userId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    return row ? this.toCart(row) : null;
  }

  /**
   * Add a product to a cart (or increment its quantity if already present).
   */
  @Mutation(() => Cart, { description: 'Add a product to a cart.' })
  async addItemToCart(
    @Args('cartId', { type: () => ID }) cartId: string,
    @Args('input') input: AddItemInput,
  ): Promise<Cart> {
    await this.ensureCart(cartId);

    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, price: true, currency: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId, productId: input.productId },
      },
      update: { quantity: { increment: input.quantity } },
      create: {
        cartId,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: product.price,
        currency: product.currency,
      },
    });

    return this.loadCart(cartId);
  }

  /**
   * Update the quantity of an existing cart line item.
   */
  @Mutation(() => Cart, { description: 'Update a cart line item quantity.' })
  async updateCartItem(
    @Args('cartId', { type: () => ID }) cartId: string,
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('input') input: UpdateItemInput,
  ): Promise<Cart> {
    await this.ensureCart(cartId);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    });

    return this.loadCart(cartId);
  }

  /**
   * Remove a line item from a cart.
   */
  @Mutation(() => Cart, { description: 'Remove a line item from a cart.' })
  async removeItemFromCart(
    @Args('cartId', { type: () => ID }) cartId: string,
    @Args('itemId', { type: () => ID }) itemId: string,
  ): Promise<Cart> {
    await this.ensureCart(cartId);

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.loadCart(cartId);
  }

  /**
   * Remove all line items from a cart.
   */
  @Mutation(() => Cart, { description: 'Clear all line items from a cart.' })
  async clearCart(@Args('cartId', { type: () => ID }) cartId: string): Promise<Cart> {
    await this.ensureCart(cartId);

    await this.prisma.cartItem.deleteMany({ where: { cartId } });

    return this.loadCart(cartId);
  }

  // ---- private helpers ----

  private async ensureCart(cartId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      select: { id: true },
    });
    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} not found`);
    }
  }

  private async loadCart(cartId: string): Promise<Cart> {
    const row = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    if (!row) {
      throw new NotFoundException(`Cart ${cartId} not found`);
    }
    return this.toCart(row);
  }

  private toCart(row: CartRow): Cart {
    const cart = new Cart();
    cart.id = row.id;
    cart.items = row.items.map((item) => this.toCartItem(item));

    const subtotal = row.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const currency = row.items[0]?.currency ?? 'USD';
    cart.subtotal = { amount: subtotal, currency };
    cart.itemCount = row.items.reduce((sum, item) => sum + item.quantity, 0);

    return cart;
  }

  private toCartItem(row: CartItemRow): CartItem {
    const item = new CartItem();
    item.id = row.id;
    item.productId = row.productId;
    item.quantity = row.quantity;
    item.unitPrice = { amount: row.unitPrice, currency: row.currency };
    item.product = this.toProductRef(row.product);
    return item;
  }

  private toProductRef(row: {
    id: string;
    name: string;
    imageUrl: string | null;
  }): ProductRef {
    const ref = new ProductRef();
    ref.id = row.id;
    ref.name = row.name;
    ref.imageUrl = row.imageUrl;
    return ref;
  }
}
