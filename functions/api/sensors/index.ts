export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  const start = url.searchParams.get('start');
  const stop = url.searchParams.get('stop');
  const limit = url.searchParams.get('limit') || '1000';

  if (!start || !stop) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing start or stop parameter'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiUrl = `https://api.cabinpi.com/api/sensors?start=${start}&stop=${stop}&limit=${limit}`;

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
