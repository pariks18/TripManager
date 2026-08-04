import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { DocumentType } from '@/types';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const documents = await dbStore.getUserDocuments(user.id);
    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('[API /api/user/documents GET error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentType, documentNo, fileUrl, fileName } = await request.json();

    if (!documentType || !fileUrl) {
      return NextResponse.json({ error: 'Document type and file are required' }, { status: 400 });
    }

    const document = await dbStore.upsertUserDocument(
      user.id,
      documentType as DocumentType,
      documentNo || '',
      fileUrl,
      fileName
    );

    return NextResponse.json({ document }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/user/documents POST error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 400 });
  }
}
