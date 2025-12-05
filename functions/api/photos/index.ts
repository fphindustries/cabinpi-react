export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date');

  const apiUrl = date
    ? `https://api.cabinpi.com/api/photos?date=${date}`
    : 'https://api.cabinpi.com/api/photos';

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

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
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
