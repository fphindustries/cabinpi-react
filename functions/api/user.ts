export async function onRequest(context: { request: Request }) {
  try {
    // Cloudflare Access adds headers with user information
    const headers = context.request.headers;

    // Common Cloudflare Access headers
    const email = headers.get('cf-access-authenticated-user-email');
    const userId = headers.get('cf-access-user-id');
    const name = headers.get('cf-access-user-name');

    // If no email is found, user is not authenticated via Cloudflare Access
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        authenticated: false,
        error: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      authenticated: true,
      user: {
        email,
        userId,
        name: name || email.split('@')[0], // Use part before @ if name not available
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
