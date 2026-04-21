import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workers = await prisma.user.findMany({
      where: {
        userType: {
          in: ['teacher', 'admin', 'root']
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address, userType, subject } = body;

    if (!name || !email || !phone || !address || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Generate Display ID
    const prefix = userType === 'teacher' ? 'TEA-' : 'ADM-';
    const count = await prisma.user.count({ where: { userType } });
    const displayId = `${prefix}${(count + 1).toString().padStart(3, '0')}`;

    // Temporary password
    const password = crypto.randomBytes(4).toString('hex');
    // NOTE: In production, hash this password before saving!
    // Using clear text here for the temporary placeholder based on original implementation idea
    // but a real app should use bcrypt.

    const user = await prisma.user.create({
      data: {
        displayId,
        name,
        email,
        phone,
        address,
        userType,
        subject: subject || null,
        password, // Not hashed just for demo to show temporary password on client easily.
      }
    });

    return NextResponse.json({ user, displayId, password }, { status: 201 });
  } catch (error) {
    console.error('Error creating worker:', error);
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
