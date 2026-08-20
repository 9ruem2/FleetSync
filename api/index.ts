import { handleApiRequest } from '../backend/src/api/handler';

export default async function handler(req: any, res?: any) {
  // 1. Web Standard Request 형태인 경우
  if (typeof Request !== 'undefined' && req instanceof Request && !res) {
    return handleApiRequest(req);
  }

  // 2. Node.js (IncomingMessage & ServerResponse) 형태인 경우
  try {
    const protocol = req.headers?.['x-forwarded-proto'] || 'https';
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'localhost';
    
    // Vercel이 전달하는 원본 URL 경로 추출
    const originalPath = req.url || '/';
    const fullUrl = `${protocol}://${host}${originalPath}`;
    const method = req.method || 'GET';

    let bodyData: string | undefined = undefined;
    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
      if (req.body) {
        bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        bodyData = Buffer.concat(chunks).toString('utf-8');
      }
    }

    const headers = new Headers();
    if (req.headers) {
      Object.entries(req.headers).forEach(([k, v]) => {
        if (v !== undefined) {
          if (Array.isArray(v)) {
            v.forEach((val) => headers.append(k, val));
          } else {
            headers.set(k, String(v));
          }
        }
      });
    }

    const webReq = new Request(fullUrl, {
      method,
      headers,
      body: bodyData,
    });

    const webRes = await handleApiRequest(webReq);

    if (res && typeof res.status === 'function') {
      res.status(webRes.status);
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const responseText = await webRes.text();
      res.setHeader('Content-Type', 'application/json');
      res.end(responseText);
      return;
    }

    return webRes;
  } catch (error: any) {
    console.error('[Vercel API Adapter Error]:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    if (res && typeof res.status === 'function') {
      res.status(500).setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: msg }));
      return;
    }
    return new Response(JSON.stringify({ success: false, message: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
