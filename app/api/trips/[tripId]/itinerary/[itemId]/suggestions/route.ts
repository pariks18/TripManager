import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

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
    // ----------------------------------------
    // 1. Get itinerary item
    // ----------------------------------------

    const item = await dbStore.getItineraryItem(
      params.itemId
    );

    if (!item) {
      return NextResponse.json(
        {
          error: 'Itinerary item not found',
        },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // 2. Make sure item belongs to requested trip
    // ----------------------------------------

    if (item.tripId !== params.tripId) {
      return NextResponse.json(
        {
          error: 'Itinerary item does not belong to this trip',
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 3. Create AI prompt
    // ----------------------------------------

    const prompt = `
You are a smart travel itinerary assistant.

Analyze the following itinerary activity and provide useful suggestions.

ACTIVITY INFORMATION:

Title:
${item.title || 'Not specified'}

Category:
${item.category || 'Not specified'}

Start Time:
${item.startTime || 'Not specified'}

End Time:
${item.endTime || 'Not specified'}

Location:
${item.location || 'Not specified'}

Description:
${item.description || 'Not specified'}


YOUR TASK:

Identify only useful suggestions that can help the traveler prepare for this activity.

You can identify:

1. Missing Information
   Information that would be useful to have but is not provided.

2. Don't Forget
   Useful reminders directly related to the activity and the information provided.

3. Possible Issue
   A problem that can actually be identified from the provided information.


STRICT RULES:

- Use simple English.
- Use ONLY the information provided above.
- Do NOT invent facts.
- Do NOT assume information that is not provided.
- Do NOT invent train numbers.
- Do NOT invent ticket numbers.
- Do NOT invent booking details.
- Do NOT invent timings.
- Do NOT invent locations.
- Do NOT invent travel duration.
- Do NOT invent prices.
- Do NOT invent hotel information.
- Do NOT invent platform numbers.
- Do NOT invent coach or seat numbers.
- If something is missing, say that it is missing instead of guessing it.
- Do not create unnecessary warnings.
- Only return suggestions that are genuinely useful.
- If there are no useful suggestions, return an empty array.
- Do not give generic travel advice.
- Do not replace the user's planning.
- Do not include reasoning or <think> tags.


IMPORTANT:

For missing information, only mention information that is reasonably relevant to this specific activity.

For example:

If the activity is transportation, potentially useful missing information can include:
- Transport/train/flight/bus number
- Booking or ticket details
- Boarding information
- Coach/seat details

But ONLY report these as missing information. Never create their values.


Return ONLY valid JSON in this exact structure:

{
  "suggestions": [
    {
      "type": "MISSING_INFORMATION",
      "title": "Missing Information",
      "items": [
        "Information that is missing"
      ]
    }
  ]
}

Allowed types:

MISSING_INFORMATION
REMINDER
WARNING

Each suggestion must contain:

type
title
items
`;

    // ----------------------------------------
    // 4. Call Groq
    // ----------------------------------------

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },

        body: JSON.stringify({
          model: 'qwen/qwen3.6-27B',

          messages: [
            {
              role: 'system',
              content:
                'You are a smart travel itinerary assistant. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],

          reasoning_effort: 'none',

          response_format: {
            type: 'json_object',
          },

          temperature: 0.2,

          max_completion_tokens: 500,
        }),
      }
    );

    // ----------------------------------------
    // 5. Handle Groq error
    // ----------------------------------------

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();

      console.error(
        'Groq Suggestions API error:',
        errorData
      );

      return NextResponse.json(
        {
          error: 'Failed to generate AI suggestions',
        },
        { status: 500 }
      );
    }

    // ----------------------------------------
    // 6. Read Groq response
    // ----------------------------------------

    const data = await groqResponse.json();

    const content =
      data.choices?.[0]?.message?.content?.trim();

    console.log(
      'Groq Suggestions Response:',
      content
    );

    if (!content) {
      return NextResponse.json(
        {
          error: 'AI returned an empty response',
        },
        { status: 500 }
      );
    }

    // ----------------------------------------
    // 7. Parse JSON
    // ----------------------------------------

    let result;

    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error(
        'Failed to parse AI JSON:',
        content
      );

      return NextResponse.json(
        {
          error: 'AI returned invalid JSON',
        },
        { status: 500 }
      );
    }

    // ----------------------------------------
    // 8. Validate response
    // ----------------------------------------

    if (
      !result ||
      !Array.isArray(result.suggestions)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid AI suggestions format',
        },
        { status: 500 }
      );
    }

    // ----------------------------------------
    // 9. Return response
    // ----------------------------------------

    return NextResponse.json({
      suggestions: result.suggestions,
    });
  } catch (error: any) {
    console.error(
      'AI Suggestions Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to generate AI suggestions',
      },
      { status: 500 }
    );
  }
}