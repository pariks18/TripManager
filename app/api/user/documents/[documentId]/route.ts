import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await dbStore.deleteUserDocument(params.documentId, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('[API /api/user/documents/[documentId] DELETE error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete document' }, { status: 400 });
  }
}
