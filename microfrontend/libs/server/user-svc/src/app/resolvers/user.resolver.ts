import { createHash, randomUUID } from 'node:crypto';
import { Args, Mutation, Query } from '@nestjs/graphql';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/shared';
import { LoginInput } from '../dto/login.input';
import { UpdateProfileInput } from '../dto/update-profile.input';
import { User } from '../dto/user.type';
import { Order } from '../dto/order.type';
import { OrderItem } from '../dto/order-item.type';
import { OrderStatus } from '../dto/order-status.enum';

/**
 * User GraphQL resolver.
 *
 * Backed by Prisma (real DB) — see `prisma/schema.prisma`. The user domain is
 * read + write: `me` / `orders` queries and `login` / `updateProfile` mutations.
 *
 * NOTE: This is a reference architecture — there is no real auth/session
 * middleware yet (the gateway adds a JWT stub in Phase 4.5). The "current
 * user" is resolved to the seeded demo account (`demo@example.com`).
 *
 * Passwords are verified with a deterministic SHA-256 hash (matching the seed
 * in `prisma/seed.mjs`) — no real credential storage in this reference.
 */

/** Shape of a Prisma `User` row. */
type UserRow = {
  id: string;
  email: string;
  name: string;
  line1: string;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  passwordHash: string;
};

/** Shape of a Prisma `OrderItem` row. */
type OrderItemRow = {
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

/** Shape of a Prisma `Order` row with its nested items. */
type OrderRow = {
  id: string;
  createdAt: Date;
  /** Prisma returns its own `$Enums.OrderStatus` string union — cast at the boundary. */
  status: string;
  total: number;
  currency: string;
  items: OrderItemRow[];
};

/** The seeded demo account used as the "current user" stub. */
const DEMO_EMAIL = 'demo@example.com';

export class UserResolver {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The current user (stub: the seeded demo account).
   */
  @Query(() => User, {
    nullable: true,
    description: 'The currently authenticated user.',
  })
  async me(): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
    });
    return row ? this.toUser(row) : null;
  }

  /**
   * The current user's orders (stub: the seeded demo account).
   */
  @Query(() => [Order], {
    description: "The currently authenticated user's orders.",
  })
  async orders(): Promise<Order[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (!user) {
      return [];
    }

    const rows = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toOrder(row));
  }

  /**
   * Authenticate a user by email + password and create a session.
   */
  @Mutation(() => User, {
    description: 'Authenticate a user and create a session.',
  })
  async login(@Args('input') input: LoginInput): Promise<User> {
    const row = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!row) {
      throw new NotFoundException(`User ${input.email} not found`);
    }

    const hash = createHash('sha256').update(input.password).digest('hex');
    if (row.passwordHash !== hash) {
      throw new BadRequestException('Invalid credentials');
    }

    // Create a session (30-day expiry) — mirrors the seed's session shape.
    await this.prisma.session.create({
      data: {
        userId: row.id,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    return this.toUser(row);
  }

  /**
   * Update the current user's name + address (stub: the seeded demo account).
   */
  @Mutation(() => User, { description: 'Update the current user profile.' })
  async updateProfile(@Args('input') input: UpdateProfileInput): Promise<User> {
    const row = await this.prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
    });
    if (!row) {
      throw new NotFoundException(`User ${DEMO_EMAIL} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: row.id },
      data: {
        name: input.name,
        line1: input.address.line1,
        city: input.address.city,
        state: input.address.state,
        postalCode: input.address.postalCode,
        country: input.address.country,
      },
    });

    return this.toUser(updated);
  }

  // ---- private helpers ----

  private toUser(row: UserRow): User {
    const user = new User();
    user.id = row.id;
    user.email = row.email;
    user.name = row.name;
    user.address = {
      line1: row.line1,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
    };
    return user;
  }

  private toOrder(row: OrderRow): Order {
    const order = new Order();
    order.id = row.id;
    order.createdAt = row.createdAt;
    order.status = row.status as OrderStatus;
    order.items = row.items.map((item) => this.toOrderItem(item));
    order.total = { amount: row.total, currency: row.currency };
    return order;
  }

  private toOrderItem(row: OrderItemRow): OrderItem {
    const item = new OrderItem();
    item.productId = row.productId;
    item.quantity = row.quantity;
    item.unitPrice = { amount: row.unitPrice, currency: row.currency };
    return item;
  }
}
