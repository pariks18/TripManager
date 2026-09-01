import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';


// --------------------------------------------
// Convert time string to minutes
// Supports:
// 4:15
// 4:15 AM
// 09:30 AM
// 18:30
// --------------------------------------------

function timeToMinutes(
  time: string | null
): number | null {
  if (!time) return null;

  const value = time.trim().toUpperCase();

  // 12-hour format
  const match12 = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
  );

  if (match12) {
    let hours = Number(match12[1]);
    const minutes = Number(match12[2]);
    const period = match12[3];

    if (
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return hours * 60 + minutes;
  }

  // 24-hour format
  const match24 = value.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (match24) {
    const hours = Number(match24[1]);
    const minutes = Number(match24[2]);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  return null;
}


// --------------------------------------------
// Find obvious timing issues
// --------------------------------------------

function findTimingIssues(items: any[]) {
  const issues: any[] = [];

  const groupedByDay = new Map<
    number,
    any[]
  >();

  // Group activities by day
  for (const item of items) {
    const existing =
      groupedByDay.get(item.dayNumber) || [];

    existing.push(item);

    groupedByDay.set(
      item.dayNumber,
      existing
    );
  }

  // Check each day
  for (const [day, dayItems] of groupedByDay) {
    const sortedItems = [...dayItems].sort(
      (a, b) => {
        const aTime =
          timeToMinutes(a.startTime) ??
          Number.MAX_SAFE_INTEGER;

        const bTime =
          timeToMinutes(b.startTime) ??
          Number.MAX_SAFE_INTEGER;

        return aTime - bTime;
      }
    );

    for (
      let i = 0;
      i < sortedItems.length - 1;
      i++
    ) {
      const current = sortedItems[i];
      const next = sortedItems[i + 1];

      const currentStart = timeToMinutes(
        current.startTime
      );

      const currentEnd = timeToMinutes(
        current.endTime
      );

      const nextStart = timeToMinutes(
        next.startTime
      );

      // --------------------------------
      // Actual overlap
      // --------------------------------

      if (
        currentEnd !== null &&
        nextStart !== null &&
        nextStart < currentEnd
      ) {
        issues.push({
          type: 'TIMING_CONFLICT',
          day,
          firstActivity: current.title,
          secondActivity: next.title,
          message:
            `"${current.title}" overlaps with "${next.title}".`,
        });

        continue;
      }

      // --------------------------------
      // Very small gap
      // --------------------------------

      if (
        currentEnd !== null &&
        nextStart !== null
      ) {
        const gap =
          nextStart - currentEnd;

        if (gap >= 0 && gap <= 30) {
          issues.push({
            type: 'TIGHT_SCHEDULE',
            day,
            firstActivity: current.title,
            secondActivity: next.title,
            gapMinutes: gap,
          });
        }
      }

      // --------------------------------
      // Only start times available
      // --------------------------------

      if (
        currentStart !== null &&
        currentEnd === null &&
        nextStart !== null
      ) {
        const gap =
          nextStart - currentStart;

        if (gap >= 0 && gap <= 30) {
          issues.push({
            type: 'TIGHT_SCHEDULE',
            day,
            firstActivity: current.title,
            secondActivity: next.title,
            gapMinutes: gap,
          });
        }
      }
    }
  }

  return issues;
}


// --------------------------------------------
// POST /ai-trip-check
// --------------------------------------------

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: {
      tripId: string;
    };
  }
) {
  const user = await getSessionUser();

  // --------------------------------------------
  // Authentication
  // --------------------------------------------

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      {
        status: 401,
      }
    );
  }

  try {
    // --------------------------------------------
    // Get complete itinerary
    // --------------------------------------------

    const items =
      await dbStore.getTripItinerary(
        params.tripId
      );

    if (!items || items.length === 0) {
      return NextResponse.json({
        status: 'OK',
        issues: [],
        overallSummary:
          'No itinerary activities have been added yet.',
      });
    }

    // --------------------------------------------
    // Backend timing analysis
    // --------------------------------------------

    const timingIssues =
      findTimingIssues(items);

    console.log(
      'AI Trip Check - Timing Issues:',
      timingIssues
    );

    // --------------------------------------------
    // Send only required data to AI
    // --------------------------------------------

    const itineraryForAI =
      items.map((item) => ({
        day: item.dayNumber,
        date: item.date,
        activity: item.title,
        category: item.category,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
        description: item.description,
      }));


    // --------------------------------------------
    // Create prompt
    // --------------------------------------------

    const prompt = `
You are a smart travel itinerary assistant.

Analyze the complete itinerary below.

ITINERARY:

${JSON.stringify(
  itineraryForAI,
  null,
  2
)}

SYSTEM-DETECTED TIMING INFORMATION:

${JSON.stringify(
  timingIssues,
  null,
  2
)}


YOUR TASK:

Review the itinerary and identify useful planning issues or suggestions.

Check for:

1. Timing conflicts.
2. Very short gaps between activities.
3. Missing important information.
4. Schedule that appears unnecessarily tight.
5. Useful preparation reminders.


STRICT RULES:

- Use ONLY the information provided.
- Use simple English.
- Do NOT invent information.
- Do NOT guess missing information.
- Do NOT invent train numbers.
- Do NOT invent flight numbers.
- Do NOT invent hotel details.
- Do NOT invent booking details.
- Do NOT invent prices.
- Do NOT invent platform numbers.
- Do NOT invent coach numbers.
- Do NOT invent seat numbers.
- Do NOT invent travel duration.
- Do NOT invent distances.
- Do NOT assume traffic conditions.
- Do NOT assume opening hours.
- Do NOT assume a journey is possible or impossible unless the provided information proves it.
- Do NOT claim that travel time is insufficient if travel duration is not provided.
- Use system-detected timing conflicts as factual.
- Do not create unnecessary warnings.
- If there are no major issues, return status "OK".
- Do not replace the user's planning decisions.
- Return only valid JSON.


IMPORTANT:

A missing piece of information should be reported as
MISSING_INFORMATION only when it is relevant to the activity.

Do not list every possible piece of information.

Only mention useful missing information.


Return JSON in exactly this format:

{
  "status": "OK",
  "issues": [],
  "overallSummary": "Your itinerary looks well planned based on the available information."
}


Possible status values:

OK
WARNING
CONFLICT


Possible issue types:

TIMING_CONFLICT
TIGHT_SCHEDULE
MISSING_INFORMATION
PRACTICAL_SUGGESTION


Each issue must contain:

{
  "type": "...",
  "day": 1,
  "title": "Short title",
  "message": "Simple explanation"
}
`;

    // --------------------------------------------
    // Call Groq
    // --------------------------------------------

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,
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

          max_completion_tokens: 800,
        }),
      }
    );

    // --------------------------------------------
    // Groq error
    // --------------------------------------------

    if (!groqResponse.ok) {
      const errorData =
        await groqResponse.json();

      console.error(
        'Groq AI Trip Check error:',
        errorData
      );

      return NextResponse.json(
        {
          error:
            'Failed to analyze itinerary',
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------
    // Read Groq response
    // --------------------------------------------

    const data =
      await groqResponse.json();

    const content =
      data.choices?.[0]?.message?.content?.trim();

    console.log(
      'Groq AI Trip Check response:',
      content
    );

    if (!content) {
      return NextResponse.json(
        {
          error:
            'AI returned an empty response',
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------
    // Parse JSON
    // --------------------------------------------

    let result;

    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error(
        'AI Trip Check JSON parse error:',
        content
      );

      return NextResponse.json(
        {
          error:
            'AI returned invalid JSON',
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------
    // Validate response
    // --------------------------------------------

    if (
      !result ||
      !result.status ||
      !Array.isArray(result.issues)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid AI Trip Check response format',
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------
    // Return result
    // --------------------------------------------

    return NextResponse.json({
      status: result.status,
      issues: result.issues,
      overallSummary:
        result.overallSummary ||
        'Your itinerary has been checked.',
    });
  } catch (error: any) {
    console.error(
      'AI Trip Check Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to perform AI Trip Check',
      },
      {
        status: 500,
      }
    );
  }
}