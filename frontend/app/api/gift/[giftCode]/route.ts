import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { giftCode: string } }) {
  const { giftCode } = params;
  if (!giftCode) {
    return new Response(JSON.stringify({ error: 'Gift code required' }), { status: 400 });
  }
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const apiRes = await fetch(`${backendUrl}/giftpacks/code/${giftCode}`);
    if (apiRes.status === 404) {
      return new Response(JSON.stringify({ error: 'Gift not found' }), { status: 404 });
    }
    if (!apiRes.ok) {
      throw new Error(`Backend error: ${apiRes.status}`);
    }
    const data = await apiRes.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch gift info', details: error.message }), { status: 500 });
  }
}
