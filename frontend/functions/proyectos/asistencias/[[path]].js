export async function onRequest(context) {
  const url = new URL(context.request.url);

  const targetHost = 'app-asistencias-dorian-9685c6f6d9a7.herokuapp.com';
  const targetUrl = new URL(url.pathname + url.search, `https://${targetHost}`);

  const request = new Request(targetUrl, context.request);
  request.headers.set('Host', targetHost);
  request.headers.set('X-Forwarded-Host', url.host);

  const response = await fetch(request);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
