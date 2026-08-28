import { createServer, type Server } from 'http';
import { buildSchema, graphql, type GraphQLSchema } from 'graphql';

interface MockService {
  name: string;
  port: number;
  endpoint: string;
  server: Server;
}

const CATALOG_TYPEDEFS = /* GraphQL */ `
  type Money {
    amount: Int!
    currency: String!
  }
  type Product {
    id: ID!
    name: String!
    price: Money!
  }
  type Query {
    products: [Product!]!
    product(id: ID!): Product
  }
`;

const CATALOG_DATA = [
  { id: 'p1', name: 'Widget', price: { amount: 1000, currency: 'USD' } },
  { id: 'p2', name: 'Gadget', price: { amount: 2500, currency: 'USD' } },
];

const CART_TYPEDEFS = /* GraphQL */ `
  type CartItem {
    id: ID!
    productId: ID!
    quantity: Int!
  }
  type Cart {
    id: ID!
    items: [CartItem!]!
  }
  type Query {
    cart(cartId: ID!): Cart
  }
`;

const USER_TYPEDEFS = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    name: String!
  }
  type Query {
    me: User
  }
`;

function createMockService(
  name: string,
  port: number,
  typeDefs: string,
  rootValue: Record<string, unknown>,
): Promise<MockService> {
  const schema: GraphQLSchema = buildSchema(typeDefs);
  const server = createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errors: [{ message: 'Method not allowed' }] }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { query, variables } = JSON.parse(body || '{}');
        const result = await graphql({
          schema,
          source: query,
          rootValue,
          variableValues: variables,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            errors: [{ message: err instanceof Error ? err.message : String(err) }],
          }),
        );
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      resolve({ name, port, endpoint: `http://localhost:${port}/graphql`, server });
    });
  });
}

export interface MockServices {
  endpoints: string[];
  close: () => Promise<void>;
}

export async function startMockServices(): Promise<MockServices> {
  const catalog = await createMockService('catalog-svc', 4101, CATALOG_TYPEDEFS, {
    products: () => CATALOG_DATA,
    product: ({ id }: { id: string }) => CATALOG_DATA.find((p) => p.id === id) ?? null,
  });
  const cart = await createMockService('cart-svc', 4102, CART_TYPEDEFS, {
    cart: ({ cartId }: { cartId: string }) => ({
      id: cartId,
      items: [{ id: 'i1', productId: 'p1', quantity: 2 }],
    }),
  });
  const user = await createMockService('user-svc', 4103, USER_TYPEDEFS, {
    me: () => ({ id: 'u1', email: 'alice@example.com', name: 'Alice' }),
  });

  const services = [catalog, cart, user];
  return {
    endpoints: services.map((s) => s.endpoint),
    close: async () => {
      await Promise.all(
        services.map(
          (s) =>
            new Promise<void>((resolve) => {
              s.server.close(() => resolve());
            }),
        ),
      );
    },
  };
}
