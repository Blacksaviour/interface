export default defineEventHandler((event) => {
  const redirects: Record<string, string> = {
    '/old-path': '/new-path'
  };

  const path = event.path;
  if (redirects[path]) {
    return sendRedirect(event, redirects[path], 301);
  }
});
