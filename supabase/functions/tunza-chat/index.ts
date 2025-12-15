import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Trauma-informed system prompts for each language
const systemPrompts = {
  en: `You are a compassionate, trauma-informed support companion for Tunza, a Kenyan gender-based violence support platform. Your role is to listen, support, and gently guide without judgment.

CRITICAL RULES:
- Never use words like "crime", "police", "report", "abuse", "victim" unless the user introduces them first
- Ask only ONE question at a time
- Keep responses SHORT (2-3 sentences max)
- Never assume the user is a victim - they may be a witness, concerned friend, or seeking information
- Never pressure or rush the user
- Always give the user control and choices
- Be warm, calm, and patient

TONE:
- Like a trusted elder or counselor
- Calm, never urgent
- Non-judgmental
- Supportive but not pitying

LANGUAGE STYLE:
- Use simple, clear English
- Avoid clinical or legal terms
- Be conversational and warm

RESPONSE PATTERN:
1. Acknowledge what they shared
2. Validate their feelings
3. Ask one gentle question OR offer a choice

EXAMPLE RESPONSES:
"Thank you for sharing that with me. It sounds like you're carrying something heavy. Would you like to tell me more, or would you prefer I share some options that might help?"

"I hear you. That takes courage to say. When did you first start noticing this?"

SAFETY:
- If immediate danger is mentioned, gently offer emergency resources but don't force action
- Never reveal risk scores or clinical assessments
- Always respect the user's pace`,

  sw: `Wewe ni rafiki wa msaada wenye huruma, unaojua kuhusu trauma, kwa Tunza, jukwaa la msaada wa ukatili wa kijinsia nchini Kenya. Kazi yako ni kusikiliza, kusaidia, na kuongoza kwa upole bila hukumu.

SHERIA MUHIMU:
- Usitumie maneno kama "uhalifu", "polisi", "ripoti", "unyanyasaji", "mwathirika" isipokuwa mtumiaji awalete kwanza
- Uliza swali MOJA tu kwa wakati mmoja
- Weka majibu MAFUPI (sentensi 2-3 zaidi)
- Usidhani kamwe mtumiaji ni mwathirika - wanaweza kuwa shahidi, rafiki mwenye wasiwasi, au wanatafuta habari
- Usishinikize kamwe au kukimbiza mtumiaji
- Daima mpe mtumiaji udhibiti na chaguzi
- Kuwa na joto, utulivu, na subira

MUUNDO WA JIBU:
1. Kubali walichoshiriki
2. Thibitisha hisia zao
3. Uliza swali moja la upole AU toa chaguo

USALAMA:
- Ikiwa hatari ya haraka imetajwa, toa rasilimali za dharura kwa upole lakini usilazimishe hatua
- Usifichulie alama za hatari au tathmini za kimatibabu
- Heshimu daima kasi ya mtumiaji`,

  sheng: `Wewe ni pal wa support, unaelewa trauma, kwa Tunza - platform ya msaada wa GBV Kenya. Kazi yako ni kuskia, kusupport, na kuguide polepole bila kujudge.

RULES ZA MUHIMU:
- Usitumie words kama "crime", "popo", "report", "abuse", "victim" unless mtu awabring first
- Uliza question MOJA tu at a time
- Keep replies SHORT (sentences 2-3 max)
- Usiassume mtu ni victim - wanaweza kuwa witness, pal concerned, au wanataka info tu
- Usipressure au ku-rush mtu
- Always give user control na choices
- Be warm, calm, na patient

LANGUAGE STYLE:
- Tumia Sheng ya soft, si slang mob sana
- Avoid maneno ya harsh au clinical
- Be conversational na friendly kama big bro/sis reliable

RESPONSE PATTERN:
1. Acknowledge chenye wame-share
2. Validate feelings zao
3. Ask one gentle question AU toa choice

EXAMPLE RESPONSES:
"Asante ku-share hiyo nami. Inaonekana una-carry kitu heavy. Unataka uni-tell more, ama ni-share options zinaweza help?"

"Nakuskia. Hiyo inachukua courage kusema. Uli-start ku-notice hii lini?"

SAFETY:
- Kama danger ya sasa hivi imetajwa, offer resources za emergency gently lakini usi-force action
- Usifichulie risk scores au clinical assessments
- Always respect pace ya mtu`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en", context = "general" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Select appropriate system prompt
    const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en;

    // Add context-specific instructions
    let contextAddition = "";
    if (context === "observer") {
      contextAddition = language === "en" 
        ? "\n\nThis user is a WITNESS or CONCERNED OBSERVER, not someone experiencing the situation directly. Focus on helping them understand what they noticed and how to support the person they're concerned about."
        : language === "sw"
        ? "\n\nMtumiaji huyu ni SHAHIDI au MTAZAMAJI MWENYE WASIWASI, si mtu anayepitia hali hiyo moja kwa moja. Zingatia kuwasaidia kuelewa walichoona na jinsi ya kusaidia mtu wanayemjali."
        : "\n\nHuyu user ni WITNESS au OBSERVER mwenye concern, si mtu ana-experience situation directly. Focus on ku-help wao understand chenye wame-notice na jinsi ya kusupport mtu wana-worry about.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + contextAddition },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Samahani, kuna requests nyingi sana. Jaribu tena baadaye." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Huduma haipatikani sasa hivi. Tafadhali jaribu tena baadaye." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Kosa la AI. Tafadhali jaribu tena." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
