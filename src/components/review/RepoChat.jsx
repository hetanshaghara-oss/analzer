import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Card from '../ui/Card';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import './RepoChat.css';

const API_URL = '/api/ai/repo-chat';

const SUGGESTIONS = [
  'What does this project do?',
  'How is the code organized?',
  'Which tech stack does it use?',
  'Is it production-ready? What are its weak spots?',
];

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('gitinsight_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Consume the server's SSE stream and invoke onContent for every content delta.
 * Wire format (from server/routes/ai.js):
 *   data: {"content":"..."}\n\n  …  data: [DONE]\n\n
 */
async function readStream(response, onContent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) onContent(parsed.content);
        } catch {
          /* partial / keepalive line — ignore */
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
}

const RepoChat = ({ owner, repo }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (suggestion) => {
    const content = (suggestion ?? input).trim();
    if (!content || streaming) return;
    setInput('');
    setError(null);

    const history = [...messages, { role: 'user', content }];

    // Append an empty assistant bubble that the streamed reply renders into.
    setMessages([...history, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ owner, repo, messages: history }),
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        setError(
          body?.error ||
            body?.message ||
            `The AI chat request failed (${response.status}).`,
        );
        // Drop the empty assistant bubble when the request fails up front.
        setMessages((prev) =>
          prev[prev.length - 1]?.role === 'assistant' &&
          !prev[prev.length - 1].content
            ? prev.slice(0, -1)
            : prev,
        );
        return;
      }

      let acc = '';
      await readStream(response, (delta) => {
        acc += delta;
        setMessages((prev) => {
          const next = prev.slice();
          if (next.length && next[next.length - 1].role === 'assistant') {
            next[next.length - 1] = { role: 'assistant', content: acc };
          }
          return next;
        });
      });
    } catch (err) {
      setError(err.message || 'Network error while streaming the reply.');
    } finally {
      setStreaming(false);
    }
  };

  const showEmptyState = messages.length === 0 && !streaming;

  return (
    <Card className="repo-chat-card">
      <div className="repo-chat-header">
        <div className="repo-chat-title">
          <span className="repo-chat-icon">
            <Sparkles size={16} />
          </span>
          <div>
            <h3 className="text-xl font-bold">Ask GitInsight AI</h3>
            <p className="text-secondary text-sm">
              Chat about{' '}
              <span className="repo-chat-repo">
                {owner}/{repo}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="repo-chat-messages">
        {showEmptyState ? (
          <div className="repo-chat-empty">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-secondary mb-5">
              Ask anything about this repository — architecture, code quality,
              setup, or whether it&apos;s ready for production. Answers are
              grounded in the repo&apos;s live GitHub data.
            </p>
            <div className="repo-chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="repo-chat-chip"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-row ${m.role}`}>
              <div className="chat-avatar">
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`chat-bubble ${m.role}`}>
                {m.role === 'assistant' ? (
                  m.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="chat-md">
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="chat-typing">▍</span>
                  )
                ) : (
                  <p className="chat-user-text">{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="repo-chat-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="repo-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            streaming ? 'GitInsight AI is replying…' : 'Ask about this repo…'
          }
          rows={2}
          disabled={streaming}
        />
        <button
          type="button"
          className="btn-primary repo-chat-send"
          onClick={() => send()}
          disabled={streaming || !input.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
};

export default RepoChat;
