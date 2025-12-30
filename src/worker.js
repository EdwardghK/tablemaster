export default {
  async fetch(request, env) {
    // Serve built static files from /dist
    return env.ASSETS.fetch(request);
  },
};
