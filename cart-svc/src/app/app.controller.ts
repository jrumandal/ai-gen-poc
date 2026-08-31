import { Controller, Get } from '@nestjs/common';

/**
 * Service-info root endpoint for cart-svc.
 * The `/health` endpoint is provided by the shared `HealthModule` (see `@server/shared`).
 * This controller exposes a human-friendly service index at `GET /`.
 */
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'cart-svc',
      status: 'ok',
      graphql: '/graphql',
      docs: '/api-docs',
      health: '/health',
    };
  }
}
