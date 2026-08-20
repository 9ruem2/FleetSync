import { handleApiRequest } from '../backend/src/api/handler';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: Request) {
  return handleApiRequest(req);
}
