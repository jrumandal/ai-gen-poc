import 'reflect-metadata';
import { graphql } from 'graphql';
import { GatewayService } from '@server/api-gateway';
import { startMockServices, type MockServices } from '../support/mock-services';

describe('api-gateway stitching (e2e)', () => {
  let mockServices: MockServices;
  let gatewayService: GatewayService;

  beforeAll(async () => {
    // Boot the three mock upstream services (catalog/cart/user) on 4101/4102/4103.
    mockServices = await startMockServices();
    // Point the gateway at the mocks BEFORE it introspects.
    process.env.GATEWAY_SERVICES = mockServices.endpoints.join(',');

    // Instantiate the gateway service and run its lifecycle hook, which
    // introspects each upstream, wraps it, and stitches the merged schema.
    gatewayService = new GatewayService();
    await gatewayService.onModuleInit();
  });

  afterAll(async () => {
    await mockServices?.close();
  });

  it('stitches catalog, cart, and user into one schema', async () => {
    const result = await graphql({
      schema: gatewayService.schema,
      source: /* GraphQL */ `
        {
          products {
            id
            name
            price {
              amount
              currency
            }
          }
          cart(cartId: "c1") {
            id
            items {
              id
              productId
              quantity
            }
          }
          me {
            id
            email
            name
          }
        }
      `,
    });

    expect(result.errors).toBeUndefined();
    const d = result.data as {
      products: Array<{ id: string; name: string; price: { amount: number; currency: string } }>;
      cart: { items: unknown[] };
      me: { id: string; email: string; name: string };
    };
    expect(d.products).toHaveLength(2);
    expect(d.products[0]).toEqual({
      id: 'p1',
      name: 'Widget',
      price: { amount: 1000, currency: 'USD' },
    });
    expect(d.cart.items).toHaveLength(1);
    expect(d.me).toEqual({ id: 'u1', email: 'alice@example.com', name: 'Alice' });
  });

  it('resolves a single product by id', async () => {
    const result = await graphql({
      schema: gatewayService.schema,
      source: /* GraphQL */ `
        {
          product(id: "p2") {
            id
            name
            price {
              amount
              currency
            }
          }
        }
      `,
    });

    expect(result.errors).toBeUndefined();
    const d = result.data as {
      product: { id: string; name: string; price: { amount: number; currency: string } };
    };
    expect(d.product).toEqual({
      id: 'p2',
      name: 'Gadget',
      price: { amount: 2500, currency: 'USD' },
    });
  });
});
