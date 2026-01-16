export default {
  async fetch(request, env) {
    // Serve built static files from /dist, with SPA fallback for client routes.
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }
    const url = new URL(request.url);
    const wantsHtml =
      request.method === "GET" &&
      (request.headers.get("accept") || "").includes("text/html");
    if (!wantsHtml) {
      return response;
    }
    url.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(url.toString(), request));
  },
};
