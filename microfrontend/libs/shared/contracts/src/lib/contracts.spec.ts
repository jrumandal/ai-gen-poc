import {
  ApiError,
  Cart,
  CartItem,
  Category,
  ListProductsQuery,
  LoginInput,
  Money,
  Order,
  OrderStatus,
  Product,
  ProductRef,
  UpdateItemInput,
  User,
  cart,
  catalog,
  user,
} from '../index';

/** Compile-time identity check: resolves to `true` only when A and B are exactly the same type. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;

/** No-op at runtime; the assertion happens at compile time via the `T extends true` constraint. */
function expectType<T extends true>(): void {
  /* type-level only */
}

describe('@shared/contracts public API', () => {
  it('re-exports the three service namespaces', () => {
    expect(catalog).toBeDefined();
    expect(cart).toBeDefined();
    expect(user).toBeDefined();
  });

  it('exposes the expected OpenAPI path keys', () => {
    expectType<
      Equals<
        keyof typeof catalog.paths,
        | '/catalog/products'
        | '/catalog/products/{productId}'
        | '/catalog/categories'
      >
    >();
    expectType<
      Equals<
        keyof typeof cart.paths,
        '/cart/{cartId}' | '/cart/{cartId}/items' | '/cart/{cartId}/items/{itemId}'
      >
    >();
    expectType<
      Equals<keyof typeof user.paths, '/user/me' | '/user/orders' | '/user/login'>
    >();
  });

  it('exposes ergonomic DTO types that model the domain', () => {
    const money: Money = { amount: 1999, currency: 'USD' };
    const product: Product = {
      id: 'p1',
      name: 'Widget',
      price: money,
      inStock: true,
      categories: [{ id: 'c1', name: 'Tools', slug: 'tools', children: [] }],
    };
    const category: Category = { id: 'c1', name: 'Tools', slug: 'tools', children: [] };
    const cartDoc: Cart = {
      id: 'cart1',
      items: [
        {
          id: 'ci1',
          productId: product.id,
          quantity: 2,
          unitPrice: money,
          product: { id: product.id, name: product.name, imageUrl: '' } satisfies ProductRef,
        },
      ],
      subtotal: money,
      itemCount: 1,
    };
    const userDoc: User = {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      address: { line1: '1 Main', city: 'X', postalCode: '1', country: 'US' },
    };
    const order: Order = {
      id: 'o1',
      createdAt: '2024-01-01T00:00:00.000Z',
      status: 'PLACED' satisfies OrderStatus,
      items: [{ productId: product.id, quantity: 1, unitPrice: money }],
      total: money,
    };
    const login: LoginInput = { email: 'a@b.com', password: 'secret' };
    const updateItem: UpdateItemInput = { quantity: 3 };
    const query: ListProductsQuery = { category: 'tools' };
    const error: ApiError = { code: 'NOT_FOUND', message: 'nope' };

    expect(money.amount).toBe(1999);
    expect(cartDoc.items).toHaveLength(1);
    expect(cartDoc.items[0].product.id).toBe('p1');
    expect(userDoc.address.city).toBe('X');
    expect(order.status).toBe('PLACED');
    expect(login.email).toBe('a@b.com');
    expect(updateItem.quantity).toBe(3);
    expect(query.category).toBe('tools');
    expect(error.code).toBe('NOT_FOUND');
    expect(product.categories).toEqual([category]);
  });

  it('keeps DTO types structurally exact', () => {
    expectType<Equals<Money, { amount: number; currency: string }>>();
    expectType<
      Equals<OrderStatus, 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>
    >();
    expectType<Equals<UpdateItemInput, { quantity: number }>>();
    expectType<Equals<LoginInput, { email: string; password: string }>>();
    expectType<
      Equals<
        CartItem,
        { id: string; productId: string; quantity: number; unitPrice: Money; product: ProductRef }
      >
    >();
  });
});
