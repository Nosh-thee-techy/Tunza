import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation text for summarization
    const conversationText = messages
      .map((msg: { role: string; content: string }) => 
        `${msg.role === "user" ? "User" : "Support"}: ${msg.content}`
      )
      .join("\n");

    // Language-specific prompts
    const languageInstructions = {
      en: "Generate the summary in English.",
      sw: "Tengeneza muhtasari kwa Kiswahili.",
      sheng: "Generate the summary in a respectful Sheng/English mix."
    };

    const systemPrompt = `You are a compassionate support assistant helping to summarize sensitive conversations about difficult experiences. 
    
Your task is to create a brief, dignified summary that:
1. Respects the person's privacy and dignity
2. Captures the key themes and concerns discussed
3. Notes any support options or resources mentioned
4. Uses gentle, non-judgmental language
5. Avoids graphic details or triggering language
6. Is 3-5 sentences maximum

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en}

Important: This summary will be reviewed by the user before they export it. Make it supportive and accurate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please summarize this conversation:\n\n${conversationText}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate summary");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    console.log("Summary generated successfully for conversation with", messages.length, "messages");

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-summary function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
