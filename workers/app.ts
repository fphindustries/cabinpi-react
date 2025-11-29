import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy API requests to the backend
    if (url.pathname.startsWith('/api/')) {
      const apiUrl = `https://api.cabinpi.com${url.pathname}${url.search}`;

      const headers = new Headers(request.headers);
      if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
        headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
        headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
      }

      return fetch(apiUrl, {
        method: request.method,
        headers,
        body: request.body,
      });
    }

    // Handle all other requests with React Router
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
