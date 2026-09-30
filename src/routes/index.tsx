import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  MessageCircleQuestion,
  BookOpenText,
  ListChecks,
  FileText,
  Route as RouteIcon,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  askQuestion,
  explainConcept,
  generateQuiz,
  summarizeText,
  learningPath,
  type QuizQuestion,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduGenie — Your AI Learning Assistant" },
      {
        name: "description",
        content:
          "EduGenie is an AI-powered learning assistant: ask questions, get simple explanations, generate quizzes, summarize passages, and get personalized learning paths.",
      },
      { property: "og:title", content: "EduGenie — Your AI Learning Assistant" },
      {
        property: "og:description",
        content:
          "Ask questions, understand complex concepts, generate quizzes, summarize text, and get personalized learning paths — all in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ToolId = "ask" | "explain" | "quiz" | "summarize" | "path";

const TOOLS: {
  id: ToolId;
  label: string;
  icon: typeof Sparkles;
  placeholder: string;
  button: string;
  hint: string;
}[] = [
  {
    id: "ask",
    label: "Ask a Question",
    icon: MessageCircleQuestion,
    placeholder: "e.g. Which is the largest ocean?",
    button: "Get Answer",
    hint: "Ask anything and get a smart, concise answer.",
  },
  {
    id: "explain",
    label: "Explain a Concept",
    icon: BookOpenText,
    placeholder: "e.g. Quantum computing",
    button: "Explain",
    hint: "Complex topics broken down into simple language.",
  },
  {
    id: "quiz",
    label: "Generate a Quiz",
    icon: ListChecks,
    placeholder: "e.g. The Pythagoras Theorem",
    button: "Generate Quiz",
    hint: "Test your understanding with 3 multiple-choice questions.",
  },
  {
    id: "summarize",
    label: "Summarize Text",
    icon: FileText,
    placeholder: "Paste a long passage to summarize…",
    button: "Summarize",
    hint: "Turn long passages into concise, easy-to-read summaries.",
  },
  {
    id: "path",
    label: "Learning Path",
    icon: RouteIcon,
    placeholder: "e.g. SQL",
    button: "Get Recommendations",
    hint: "A structured plan from beginner to advanced, with resources.",
  },
];

function Index() {
  const [tool, setTool] = useState<ToolId>("ask");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const askFn = useServerFn(askQuestion);
  const explainFn = useServerFn(explainConcept);
  const quizFn = useServerFn(generateQuiz);
  const summarizeFn = useServerFn(summarizeText);
  const pathFn = useServerFn(learningPath);

  const mutation = useMutation({
    mutationFn: async ({ id, text }: { id: ToolId; text: string }) => {
      switch (id) {
        case "ask":
          return { kind: "text" as const, text: (await askFn({ data: { text } })).answer };
        case "explain":
          return { kind: "text" as const, text: (await explainFn({ data: { text } })).explanation };
        case "summarize":
          return { kind: "text" as const, text: (await summarizeFn({ data: { text } })).summary };
        case "path":
          return { kind: "text" as const, text: (await pathFn({ data: { text } })).path };
        case "quiz":
          return { kind: "quiz" as const, questions: (await quizFn({ data: { text } })).questions };
      }
    },
    onSuccess: (data) => {
      if (data.kind === "quiz") {
        setQuiz(data.questions);
        setResult(null);
        setAnswers({});
        setChecked(false);
      } else {
        setResult(data.text);
        setQuiz(null);
      }
    },
  });

  const active = TOOLS.find((t) => t.id === tool)!;

  const submit = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    mutation.mutate({ id: tool, text });
  };

  const switchTool = (id: ToolId) => {
    setTool(id);
    setResult(null);
    setQuiz(null);
    setAnswers({});
    setChecked(false);
    mutation.reset();
  };

  return (
    <div className="min-h-screen paper-texture">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">EduGenie</h1>
            <p className="text-xs text-muted-foreground">Your personal AI tutor</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        {/* Hero */}
        <section className="py-12 text-center animate-rise">
          <h2 className="mx-auto max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Learning, made{" "}
            <span className="relative inline-block text-primary">
              magical
              <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-genie/60" />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Ask questions, understand complex concepts, generate quizzes, summarize
            passages, and get a personalized learning path — all in one place.
          </p>
        </section>

        {/* Tool tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === tool;
            return (
              <button
                key={t.id}
                onClick={() => switchTool(t.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        <section className="mx-auto mt-8 max-w-3xl animate-rise">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <active.icon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{active.label}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{active.hint}</p>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={active.placeholder}
              rows={tool === "summarize" ? 6 : 3}
              className="mt-4 w-full resize-y rounded-xl border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ctrl+Enter to submit</span>
              <button
                onClick={submit}
                disabled={!input.trim() || mutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> {active.button}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Text result */}
          {result && (
            <div className="mt-6 animate-rise rounded-2xl border bg-card p-6 shadow-sm">
              <h4 className="flex items-center gap-2 text-base font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Result
              </h4>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
            </div>
          )}

          {/* Quiz result */}
          {quiz && (
            <div className="mt-6 space-y-4 animate-rise">
              {quiz.map((q, qi) => (
                <div key={qi} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <p className="font-semibold">
                    Q{qi + 1}: {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi;
                      const isCorrect = checked && oi === q.answer;
                      const isWrong = checked && selected && oi !== q.answer;
                      return (
                        <label
                          key={oi}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                            isCorrect
                              ? "border-primary bg-primary/10"
                              : isWrong
                                ? "border-destructive/50 bg-destructive/10"
                                : selected
                                  ? "border-primary bg-secondary"
                                  : "hover:bg-secondary"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={selected}
                            disabled={checked}
                            onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                            className="accent-[var(--primary)]"
                          />
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {isWrong && <XCircle className="h-4 w-4 text-destructive" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-center gap-3">
                {!checked ? (
                  <button
                    onClick={() => setChecked(true)}
                    disabled={Object.keys(answers).length < quiz.length}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Check Answers
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAnswers({});
                      setChecked(false);
                    }}
                    className="rounded-xl border bg-card px-6 py-2.5 text-sm font-semibold hover:bg-secondary"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mt-20">
          <h3 className="text-center text-2xl font-bold">Everything a learner needs</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    switchTool(t.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 font-semibold">{t.label}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/60 py-6 text-center text-xs text-muted-foreground">
        EduGenie — democratizing learning with AI ✨
      </footer>
    </div>
  );
}
