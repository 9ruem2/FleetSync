import type { Config } from '@netlify/functions';
import { handleApiRequest } from '../../backend/src/api/handler';

export default async (req: Request) => handleApiRequest(req);

export const config: Config = {
  path: '/api/*',
};
