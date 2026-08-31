import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Per-request SSR: every route is rendered on the server for each request
 * (RenderMode.Server) so the MF markup is produced fresh by the Express
 * adapter.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
