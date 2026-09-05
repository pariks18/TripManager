import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PUT(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await dbStore.updateItineraryItem(params.itemId, user.id, body);
    return NextResponse.json({ item });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update itinerary item' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteItineraryItem(params.itemId, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to delete itinerary item' }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get itinerary item
    const item = await dbStore.getItineraryItem(
      params.itemId
    );

    if (!item) {
      return NextResponse.json(
        { error: 'Itinerary item not found' },
        { status: 404 }
      );
    }

    const prompt = `
Create a short and simple summary for this itinerary activity.

Use ONLY the information provided below.

Activity: ${item.title || 'Not specified'}
Category: ${item.category || 'Not specified'}
Start Time: ${item.startTime || 'Not specified'}
End Time: ${item.endTime || 'Not specified'}
Location: ${item.location || 'Not specified'}
Description: ${item.description || 'Not specified'}

Rules:
- Use simple and easy English.
- Use ONLY the information provided above.
- Do NOT add, guess, assume, or invent information.
- Do NOT give general travel advice.
- Do NOT create facts that are not present in the data.
- If a field is not specified, do not mention it.
- If only Start Time is provided, do not assume it means departure or arrival.
- Mention the activity, location and available timing naturally.
- Keep the summary between 30 and 60 words.
- Return ONLY the final summary.
- Do NOT include reasoning.
- Do NOT include <think> tags.
`;
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful travel itinerary assistant.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          reasoning_effort: 'none',
          temperature: 0.4,
          max_tokens: 200,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();

      console.error('Groq API error:', errorData);

      return NextResponse.json(
        {
          error: 'Failed to generate AI summary',
        },
        { status: 500 }
      );
    }

    const data = await groqResponse.json();

    const summary =
      data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: 'AI returned an empty summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary,
    });
  } catch (error: any) {
    console.error('AI Summary Error:', error);

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to generate itinerary summary',
      },
      { status: 500 }
    );
  }
}
