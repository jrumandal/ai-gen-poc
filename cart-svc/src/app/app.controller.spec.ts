import { AppController } from './app.controller';

describe('root', () => {
  it('returns the service index', () => {
    const controller = new AppController();
    expect(controller.root()).toEqual({
      service: 'cart-svc',
      status: 'ok',
      graphql: '/graphql',
      docs: '/api-docs',
      health: '/health',
    });
  });
});
