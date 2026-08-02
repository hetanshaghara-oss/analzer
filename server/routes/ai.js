// ─────────────────────────────────────────────────────────────────────────────
// AI Chat — lets users ask questions about any public GitHub repository.
//
// The route gathers a compact context digest from the repo's real GitHub data
// (metadata, README, file tree, languages, contributors) and sends it to a
// configured language model together with the conversation history. By default
// it targets the Vercel AI Gateway's OpenAI-compatible endpoint; set
// LLM_API_URL / LLM_API_KEY / LLM_MODEL to point at any other provider that
// exposes an OpenAI-compatible `/chat/completions` API.
//
// The model's reply is streamed back to the browser as SSE lines:
//   data: {"content":"..."}\n\n  …  data: [DONE]\n\n
//
// This router is mounted BEFORE the MongoDB gate in server/index.js on purpose:
// the chat only needs GitHub's API + the LLM, so it keeps working even when the
// database is down or still warming up.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const githubProxy = require("../services/githubProxy");

// LLM configuration (env-driven so it works on Vercel / Render / local).
const LLM_API_URL =
  process.env.LLM_API_URL || "https://ai.vercel.sh/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "anthropic/claude-sonnet-4-5";

// Token budgets — keep requests cheap and fast on serverless.
const MAX_CONTEXT_CHARS = 14000; // system prompt digest
const MAX_MESSAGE_CHARS = 4000; // per conversation message
const MAX_HISTORY = 20; // most recent messages forwarded to the model

// Chat can be chatty — give it its own slightly looser limit than the global
// API limiter (the global one skips /api/ai — see server/index.js).
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many chat requests. Please try again in a moment." },
});
router.use(chatLimiter);
router.use(optionalAuth);

function effectiveToken(req) {
  return req.user?.githubPat || req.user?.githubAccessToken || null;
}

function handleAsync(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
}

/** Build a compact, token-friendly digest of the repo for the system prompt. */
function buildRepoContext(detail, readmeText, fileTree, languages, contributors) {
  const langList = Object.entries(languages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, bytes]) => `${name} (${bytes.toLocaleString()} bytes)`)
    .join(", ");

  const topFiles = (fileTree || [])
    .slice(0, 40)
    .map((f) => (f.type === "dir" ? `📁 ${f.name}/` : f.name))
    .join("\n");

  const topContributors = (contributors || [])
    .slice(0, 10)
    .map((c) => `${c.login} (${c.contributions} commits)`)
    .join(", ");

  const readme = (readmeText || "").slice(0, 8000);

  return [
    `## Repository: ${detail.full_name || `${detail.owner?.login || "unknown"}/${detail.name || "unknown"}`}`,
    `Description: ${detail.description || "—"}`,
    `Primary language: ${detail.language || "N/A"}`,
    `Stars: ${detail.stargazers_count ?? 0} · Forks: ${detail.forks_count ?? 0} · Open issues: ${detail.open_issues_count ?? 0}`,
    `Created: ${detail.created_at || "unknown"} · Last pushed: ${detail.pushed_at || "unknown"} · License: ${detail.license?.spdx_id || "none"}`,
    `Topics: ${(detail.topics || []).slice(0, 10).join(", ") || "—"}`,
    `Size: ${detail.size ?? 0} KB · Default branch: ${detail.default_branch || "unknown"}`,
    `Languages: ${langList || "—"}`,
    `Top contributors: ${topContributors || "—"}`,
    `\n## Root-level contents (first 40):\n${topFiles || "(empty)"}`,
    readme ? `\n## README (truncated):\n${readme}` : "\n## README: not found",
  ].join("\n");
}

// POST /api/ai/repo-chat
// Body: { owner: string, repo: string, messages: [{ role, content }] }
router.post(
  "/repo-chat",
  handleAsync(async (req, res) => {
    const { owner, repo, messages } = req.body || {};

    if (!owner || !repo) {
      return res
        .status(400)
        .json({ error: "owner and repo are required." });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages must be a non-empty array." });
    }
    if (!LLM_API_KEY) {
      return res.status(503).json({
        error:
          "The AI chat is not configured yet. Add the LLM_API_KEY environment variable (plus optional LLM_MODEL / LLM_API_URL) in the Vercel dashboard and redeploy.",
        code: "AI_NOT_CONFIGURED",
      });
    }

    const accessToken = effectiveToken(req);

    // Gather the repo context server-side so the browser only sends a tiny body.
    const [detail, readmeJson, fileTree, languages, contributors] =
      await Promise.all([
        githubProxy.fetchRepoDetail(owner, repo, accessToken).catch(() => null),
        githubProxy.fetchRepoReadme(owner, repo, accessToken).catch(() => null),
        githubProxy.fetchRepoFileTree(owner, repo, accessToken).catch(() => []),
        githubProxy.fetchRepoLanguages(owner, repo, accessToken).catch(() => ({})),
        githubProxy
          .fetchRepoContributors(owner, repo, accessToken)
          .catch(() => []),
      ]);

    if (!detail) {
      return res
        .status(404)
        .json({ error: `Could not fetch repository ${owner}/${repo}.` });
    }

    let readmeText = null;
    if (readmeJson?.content) {
      try {
        readmeText = Buffer.from(
          String(readmeJson.content).replace(/\n/g, ""),
          "base64",
        ).toString("utf-8");
      } catch {
        /* invalid base64 — ignore */
      }
    }

    const contextDigest = buildRepoContext(
      detail,
      readmeText,
      fileTree,
      languages,
      contributors,
    );

    const systemPrompt = [
      "You are GitInsight AI, a senior software-engineering assistant embedded in a GitHub intelligence platform.",
      "A user is asking questions about a specific public GitHub repository. Use ONLY the repository facts below (plus general engineering knowledge) to answer.",
      "Be specific and cite the repo's actual details where relevant. If the data does not contain an answer, say so honestly instead of guessing.",
      "Keep answers focused and skimmable — short paragraphs, bullet lists, and fenced code blocks where helpful.",
      "Current repository context:\n" + contextDigest,
    ].join("\n\n");

    // Forward only the recent conversation; never trust the client's role value.
    const history = messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, MAX_MESSAGE_CHARS),
    }));

    const llmMessages = [
      { role: "system", content: systemPrompt.slice(0, MAX_CONTEXT_CHARS) },
      ...history,
    ];

    const upstream = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: llmMessages,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      console.error(
        `[AI chat] LLM upstream ${upstream.status || "error"}: ${errText.slice(0, 300)}`,
      );
      return res.status(502).json({
        error: `The language model request failed (${
          upstream.status || "unknown error"
        }). Check that LLM_API_KEY is valid and LLM_MODEL is correct.`,
      });
    }

    // Stream the upstream OpenAI-style SSE back to the browser, forwarding only
    // the content deltas so the client gets a clean { content } protocol.
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch {
            /* partial / non-JSON keepalive — ignore */
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* already released */
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  }),
);

module.exports = router;
