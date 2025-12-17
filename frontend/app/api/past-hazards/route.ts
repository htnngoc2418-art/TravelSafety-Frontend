import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://travel-safety-backend.onrender.com';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.search; // includes leading '?' if present

    const backendUrl = `${BACKEND_URL}/api/v1/hazards/past${search}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Không cache để luôn lấy data mới
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch past hazards data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching past hazards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
