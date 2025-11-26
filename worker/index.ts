export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy API requests to api.cabinpi.com
    if (url.pathname.startsWith("/api/")) {
      const apiUrl = new URL(url.pathname + url.search, "https://api.cabinpi.com");

      // Forward the request to the API server, preserving method, headers, and body
      const apiRequest = new Request(apiUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow',
      });

      return fetch(apiRequest);
    }

    // Serve static assets for all other requests
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
