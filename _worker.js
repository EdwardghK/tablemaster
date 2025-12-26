export default {
  async fetch(request, env) {
    // Serve built assets from dist via the Pages/Workers assets binding
    const response = await env.ASSETS.fetch(request);

    // SPA fallback: if a route is missing and looks like a client route, serve index.html
    if (response.status === 404 && request.method === 'GET') {
      const url = new URL(request.url);
      const lastSegment = url.pathname.split('/').pop() || '';
      const hasExtension = lastSegment.includes('.');

      if (!hasExtension) {
        const indexUrl = new URL('/index.html', url.origin);
        const indexRequest = new Request(indexUrl.toString(), request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    return response;
  },
};
