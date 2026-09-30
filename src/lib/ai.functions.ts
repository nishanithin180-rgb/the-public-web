import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function chat(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed [${response.status}]: ${body}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const textInput = z.object({ text: z.string().min(1).max(20000) });

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((data) => textInput.parse(data))
  .handler(async ({ data }) => {
    const answer = await chat(
      "You are EduGenie, a friendly AI tutor. Answer the student's question with a smart, concise answer (2-4 sentences). Use simple language.",
      data.text
    );
    return { answer };
  });

export const explainConcept = createServerFn({ method: "POST" })
  .inputValidator((data) => textInput.parse(data))
  .handler(async ({ data }) => {
    const explanation = await chat(
      "You are EduGenie, an AI tutor. Explain the given concept in simple, beginner-friendly language. Break it down into short paragraphs or a few bullet points. Assume no prior knowledge.",
      data.text
    );
    return { explanation };
  });

export const summarizeText = createServerFn({ method: "POST" })
  .inputValidator((data) => textInput.parse(data))
  .handler(async ({ data }) => {
    const summary = await chat(
      "You are EduGenie. Summarize the following text in simple language, keeping the core information and removing redundancy. Keep it concise.",
      data.text
    );
    return { summary };
  });

export const learningPath = createServerFn({ method: "POST" })
  .inputValidator((data) => textInput.parse(data))
  .handler(async ({ data }) => {
    const path = await chat(
      "You are EduGenie. Create a structured learning path for the given topic, from beginner to advanced. For each level give: level name, estimated time, key topics, and 2-3 suggested free resources (real ones like Khan Academy, freeCodeCamp, MDN, etc.). Format with clear markdown headings.",
      data.text
    );
    return { path };
  });

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
};

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((data) => textInput.parse(data))
  .handler(async ({ data }) => {
    const raw = await chat(
      `You are EduGenie, a quiz generator. Generate exactly 3 multiple-choice questions from the given topic or passage. Each question has 4 options. Respond with ONLY valid JSON, no markdown fences, in this exact shape: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":0}]} where answer is the 0-based index of the correct option.`,
      data.text
    );
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(cleaned) as { questions: QuizQuestion[] };
    return { questions: parsed.questions };
  });
