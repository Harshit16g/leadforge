import { llm, type AgentLayer, type AIRole } from "./llm";
import { buildGuardPrompt } from "./system-prompts";

export type GuardOutput = {
  classification: {
    in_context: boolean;
    intent: "management" | "research" | "customer" | "general" | "analysis" | "bookings" | "staff" | "revenue" | "inventory" | "booking";
    complexity: "simple" | "moderate" | "complex";
  };
  acknowledgement: string;
  handoff_context: string;
  actionable?: string;
};


/**
 * [GUARD LAYER] Classifies intent and streams a friendly acknowledgement
 */
export async function classifyAndAcknowledge(
  input: string, 
  onChunk: (chunk: string) => void,
  role: AIRole = "partner",
  pinnedPipeId?: string
): Promise<GuardOutput> {
  const guardSystemPrompt = buildGuardPrompt(role);

  try {
    const { stream } = await llm.stream("guard", {
      messages: [
        { role: "system", content: guardSystemPrompt },
        { role: "user", content: `Input: "${input}"` }
      ]
    }, pinnedPipeId);

    let buffer = "";
    let guardJson = "";
    let inGuardTag = false;
    let inThoughtTag = false;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      buffer += delta;

      // Processing the buffer
      while (true) {
        if (!inGuardTag && !inThoughtTag) {
          const thoughtStart = buffer.indexOf("<thought>");
          const guardStart = buffer.indexOf("<GUARD>");

          if (thoughtStart !== -1 && (guardStart === -1 || thoughtStart < guardStart)) {
            // Found thought start
            const beforeThought = buffer.substring(0, thoughtStart);
            if (beforeThought) onChunk(JSON.stringify({ type: "content", content: beforeThought }));
            
            inThoughtTag = true;
            buffer = buffer.substring(thoughtStart + 9);
          } else if (guardStart !== -1) {
            // Found guard start
            const beforeGuard = buffer.substring(0, guardStart);
            if (beforeGuard) onChunk(JSON.stringify({ type: "content", content: beforeGuard }));
            
            inGuardTag = true;
            buffer = buffer.substring(guardStart + 7);
          } else {
            // No tag start found. Send safe part (avoiding partial tag starts)
            const lastAngle = buffer.lastIndexOf("<");
            if (lastAngle !== -1 && ("<thought>".startsWith(buffer.substring(lastAngle)) || "<GUARD>".startsWith(buffer.substring(lastAngle)))) {
              const safePart = buffer.substring(0, lastAngle);
              if (safePart) onChunk(JSON.stringify({ type: "content", content: safePart }));
              buffer = buffer.substring(lastAngle);
              break;
            } else {
              if (buffer) onChunk(JSON.stringify({ type: "content", content: buffer }));
              buffer = "";
              break;
            }
          }
        } else if (inThoughtTag) {
          const thoughtEnd = buffer.indexOf("</thought>");
          if (thoughtEnd !== -1) {
            const thoughtContent = buffer.substring(0, thoughtEnd);
            if (thoughtContent) onChunk(JSON.stringify({ type: "thought", content: thoughtContent }));
            inThoughtTag = false;
            buffer = buffer.substring(thoughtEnd + 10);
          } else {
            // Still in thought tag. Check for partial end tag.
            const lastAngle = buffer.lastIndexOf("</");
            if (lastAngle !== -1 && "</thought>".startsWith(buffer.substring(lastAngle))) {
              const safePart = buffer.substring(0, lastAngle);
              if (safePart) onChunk(JSON.stringify({ type: "thought", content: safePart }));
              buffer = buffer.substring(lastAngle);
              break;
            } else {
              if (buffer) onChunk(JSON.stringify({ type: "thought", content: buffer }));
              buffer = "";
              break;
            }
          }
        } else if (inGuardTag) {
          const guardEnd = buffer.indexOf("</GUARD>");
          if (guardEnd !== -1) {
            guardJson += buffer.substring(0, guardEnd);
            inGuardTag = false;
            buffer = buffer.substring(guardEnd + 8);
          } else {
            // Still in guard tag. Check for partial end tag.
            const lastAngle = buffer.lastIndexOf("</");
            if (lastAngle !== -1 && "</GUARD>".startsWith(buffer.substring(lastAngle))) {
              const safePart = buffer.substring(0, lastAngle);
              guardJson += safePart;
              buffer = buffer.substring(lastAngle);
              break;
            } else {
              guardJson += buffer;
              buffer = "";
              break;
            }
          }
        }
      }
    }
    // Flush remaining buffer
    if (buffer && !inGuardTag && !inThoughtTag) {
      try {
        if (!buffer.includes("<")) {
          onChunk(JSON.stringify({ type: "content", content: buffer }));
        }
      } catch (e) {}
    }

    try {
      const cleanJson = guardJson.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      if (!cleanJson) throw new Error("No GUARD JSON found in output");
      const result = JSON.parse(cleanJson) as GuardOutput;
      console.log(`[GUARD] SUCCESS: Intent=${result.classification.intent}, Complexity=${result.classification.complexity}`);
      return result;
    } catch (e) {
      console.error("[GUARD] JSON Parse Error. Raw guardJson:", guardJson);
      throw e;
    }
  } catch (error) {
    console.error("[GUARD] Failed:", error);
    return { 
      classification: { in_context: true, intent: "general", complexity: "moderate" },
      acknowledgement: "I'm sorry, I encountered an error. How can I help you?",
      handoff_context: input
    };
  }
}
