import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function generateToken(password: string): string {
  return createHash('sha256').update(`mahlzeit:${password}`).digest('hex');
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correctPassword = process.env.APP_PASSWORD;

  if (!correctPassword) {
    return NextResponse.json({ error: 'APP_PASSWORD nicht konfiguriert' }, { status: 500 });
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 });
  }

  const token = generateToken(correctPassword);
  return NextResponse.json({ token });
}

export async function PUT(request: NextRequest) {
  const { token } = await request.json();
  const correctPassword = process.env.APP_PASSWORD;

  if (!correctPassword) {
    return NextResponse.json({ valid: false });
  }

  const expectedToken = generateToken(correctPassword);
  return NextResponse.json({ valid: token === expectedToken });
}
