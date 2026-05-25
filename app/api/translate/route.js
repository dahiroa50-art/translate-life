import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: body.system,
      messages: [
        {
          role: "user",
          content: body.input,
        },
      ],
    });

    return Response.json({
      content: response.content,
    });

  } catch (err) {
    console.error(err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
