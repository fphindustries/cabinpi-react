export async function onRequest(context: any) {
  const filename = context.params.filename;
  const url = new URL(context.request.url);
  const size = url.searchParams.get('size');

  const apiUrl = size
    ? `https://api.cabinpi.com/api/photos/${filename}?size=${size}`
    : `https://api.cabinpi.com/api/photos/${filename}`;

  try {
    const headers = new Headers();

    // Add Cloudflare Access credentials from environment
    const clientId = context.env.CF_ACCESS_CLIENT_ID;
    const clientSecret = context.env.CF_ACCESS_CLIENT_SECRET;

    if (clientId && clientSecret) {
      headers.set('CF-Access-Client-Id', clientId);
      headers.set('CF-Access-Client-Secret', clientSecret);
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `API request failed: ${response.status}`
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the image directly
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
