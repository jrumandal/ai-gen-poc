import { Controller, Get } from '@nestjs/common';

/**
 * Service-info root endpoint for user-svc.
 * The `/health` endpoint is provided by the shared `HealthModule` (see `@jrumandal/shared`).
 * This controller exposes a human-friendly service index at `GET /`.
 */
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'user-svc',
      status: 'ok',
      graphql: '/graphql',
      docs: '/api-docs',
      health: '/health',
    };
  }
}
