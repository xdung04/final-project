import Groq from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { createEmbedding } from "./pineconeService.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");

// ---------------------
// Sliding Window History
// Keep last 6 messages (~3 back-and-forth turns) — enough for short hair consultations
// ---------------------
const MAX_HISTORY = 10;

function trimHistory(history = []) {
  if (history.length <= MAX_HISTORY) return history;
  return history.slice(-MAX_HISTORY);
}

// ---------------------
// Call LLM
// ---------------------
async function callLLM(systemPrompt, history = [], userMessage, model = "llama-3.1-8b-instant") {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...trimHistory(history),
      { role: "user",   content: userMessage  },
    ],
    max_tokens: 1024,
    temperature: 0.4,
  });
  return response.choices[0]?.message?.content?.trim() || "";
}

// ---------------------
// Intent Classifier
// ---------------------
async function analyzeIntent(message) {
  const systemPrompt = `
You are a question classifier for Nam barbershop.
Return exactly one word, no explanation:
- "branches" → branch locations, opening hours, address, contact info
- "barbers"  → specific barbers, staff info, who to book with
- "hair"     → haircuts, hairstyles, hair care, hair products, face shape advice, trends
- "general"  → completely unrelated to barbershop or hair
`.trim();

  const raw = await callLLM(systemPrompt, [], message, "llama-3.1-8b-instant");
  const intent = raw.toLowerCase().replace(/[^a-z]/g, "");
  const valid = ["branches", "barbers", "hair"];
  return valid.includes(intent) ? intent : "general";
}

// ---------------------
// Query Pinecone
// Only used for "branches" and "barbers" — real data from Nam Barbershop
// ---------------------
async function queryPinecone(message, namespace, topK = 5) {
  const queryVector = await createEmbedding(message);
  const res = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false,
  });
  return res.matches || [];
}

// ---------------------
// System Prompt
// ---------------------
function buildSystemPrompt(contextInfo = "") {
  return `
You are Minh — a hair consultant at Nam Barbershop with over 10 years of experience.
You are not a scripted chatbot. You think, listen, and advise like a real person.

LANGUAGE: Always reply in the same language the customer uses.
TONE: Like a trusted older brother in the trade — warm, honest, no fluff.

## HOW YOU CONSULT

You consult like a real expert. That means:

**Listen first, don't conclude too fast.**
When a customer asks something vague ("what cut should I get?", "my hair is damaged"),
don't jump to an answer. Ask one follow-up question — the single most important thing
you need to know at that moment. Just one. Not a list.

**Ask to understand the person, not to fill a checklist.**
Before giving advice, you want to know things like:
- Their lifestyle: office worker, student, artist, athlete?
- Their morning routine: do they style their hair or just wash and go?
- Their current hair: texture, condition, what they're rocking now?
- What they want: a change, or refine what they have?
- Anything they want to hide or highlight on their face or head?
You don't need all of it — ask what matters most right now.

**Advise based on the full picture, never from a formula.**
Round face does NOT automatically mean pompadour.
A round-faced guy with a low forehead, thin hair, and a bank job
needs completely different advice from a round-faced athlete with thick hair.
Think it through. No copy-paste answers.

**Be straight, be honest.**
If what the customer wants won't suit them — say so clearly, explain why,
then suggest something better. Don't just agree to be nice.

**Keep it short and conversational.**
Talk like a person, not like an AI generating a report.
No unnecessary bullet points or long lists unless it genuinely helps.

## BOUNDARIES

Only discuss hair and Nam Barbershop topics.
For unrelated questions — decline politely, keep it brief.

## RECEPTIONIST HANDOFF

If the customer shows ANY of these signals, you MUST append [NEED_RECEPTIONIST]
at the very END of your response — no exceptions:
- Wants to speak to real staff or receptionist
- Complaining about the service
- Asking about booking, cancelling, or rescheduling appointments
- Phrases like: "cho tôi gặp lễ tân", "book lịch", "tôi cần hỗ trợ", "connect me to staff"

Correct example: "Let me connect you with our receptionist right away! [NEED_RECEPTIONIST]"

${contextInfo ? `## NAM BARBERSHOP DATA\n${contextInfo}` : ""}
`.trim();
}

// ---------------------
// Main Pipeline
// ---------------------
export async function sendMessage({ message, history = [] }) {
  try {
    const intent = await analyzeIntent(message);

    // Only hit Pinecone when we need real Nam Barbershop data
    let contextInfo = "";
    if (intent === "branches" || intent === "barbers") {
      const results = await queryPinecone(message, intent, 5);
      if (results.length) {
        contextInfo = results
          .map((r, i) => {
            const meta    = r.metadata?.metadata ? JSON.parse(r.metadata.metadata) : {};
            const details = r.metadata?.text?.trim().replace(/\n+/g, " ") || "";
            const name    = meta.fullName   || meta.name    || "N/A";
            const branch  = meta.branchName || meta.address || "N/A";
            return `${i + 1}. ${name} (${branch}) — ${details}`;
          })
          .join("\n");
      }
    }

    const systemPrompt = buildSystemPrompt(contextInfo);
    const reply = await callLLM(systemPrompt, history, message, "llama-3.3-70b-versatile");

    console.log("Intent   :", intent);
    console.log("Raw reply:", reply);

    const needReceptionist = reply.includes("[NEED_RECEPTIONIST]");
    const cleanReply       = reply.replace("[NEED_RECEPTIONIST]", "").trim();

    console.log("needReceptionist:", needReceptionist);

    // Update history — caller must persist this and pass it back next turn
    const updatedHistory = trimHistory([
      ...history,
      { role: "user",      content: message    },
      { role: "assistant", content: cleanReply },
    ]);

    return { intent, reply: cleanReply, needReceptionist, history: updatedHistory };
  } catch (err) {
    console.error("LLM Agent error:", err.message);
    return { reply: "Đã xảy ra lỗi khi xử lý yêu cầu 😢", history };
  }
}