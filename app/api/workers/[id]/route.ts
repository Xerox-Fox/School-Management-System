import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: { id: parseInt(id, 10) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}
