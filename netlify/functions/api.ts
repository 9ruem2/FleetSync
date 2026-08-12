import type { Config } from '@netlify/functions';
import { handleApiRequest } from '../../backend/src/api/handler';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export default async (req: Request): Promise<Response> => {
  try {
    return await handleApiRequest(req);
  } catch (error) {
    console.error('[api] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

export const config: Config = {
  path: '/api/*',
};
