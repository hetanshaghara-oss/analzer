import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronRight, ChevronLeft, Send, AlertCircle } from 'lucide-react';

/* ══════════════════════════════════════
   InterviewSession — Step 2.
   One question at a time, with a progress
   bar, optional timer, and text input.
══════════════════════════════════════ */

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const CATEGORY_LABELS = {
  language: 'Language Knowledge',
  architecture: 'Architecture & Design',
  quality: 'Code Quality & Practices',
};

const InterviewSession = ({ questions, context: _context, onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  const q = questions[current];
  const total = questions.length;
  const progress = ((current + 1) / total) * 100;

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Focus textarea on question change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [current]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
    }
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    const results = questions.map((question, i) => ({
      question,
      answer: answers[i] || '',
    }));
    onComplete(results, elapsed);
  };

  const currentAnswer = answers[current] || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="interview-session">
      {/* Header bar */}
      <div className="interview-topbar">
        <div className="interview-progress-wrap">
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="interview-progress-label">
            Question {current + 1} of {total}
          </span>
        </div>
        <div className="interview-timer">
          <Clock size={15} />
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="interview-question-card">
        <div className="interview-q-meta">
          <span
            className="interview-q-difficulty"
            style={{ color: DIFFICULTY_COLORS[q.difficulty], borderColor: DIFFICULTY_COLORS[q.difficulty] }}
          >
            {q.difficulty}
          </span>
          <span className="interview-q-category">
            {CATEGORY_LABELS[q.category] || q.category}
          </span>
          <span className="interview-q-lang">{q.language}</span>
        </div>

        <div className="interview-q-text">
          {q.question.split('\n').map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
            }} />
          ))}
        </div>
      </div>

      {/* Answer textarea */}
      <div className="interview-answer-area">
        <textarea
          ref={textareaRef}
          className="interview-textarea"
          placeholder="Type your answer here… Be specific, use examples, and explain your reasoning."
          value={currentAnswer}
          onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))}
          rows={8}
        />
        <div className="interview-answer-footer">
          <span className={`interview-word-count ${wordCount < 20 ? 'low' : wordCount > 50 ? 'good' : ''}`}>
            {wordCount} words {wordCount < 20 && wordCount > 0 && (
              <><AlertCircle size={12} /> Aim for 50+ words</>
            )}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="interview-nav">
        <button
          className="interview-nav-btn secondary"
          onClick={handlePrev}
          disabled={current === 0}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="interview-nav-dots">
          {questions.map((_, i) => (
            <button
              key={i}
              className={`interview-dot ${i === current ? 'active' : ''} ${answers[i] ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>

        {current < total - 1 ? (
          <button className="interview-nav-btn primary" onClick={handleNext}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="interview-nav-btn submit"
            onClick={handleSubmit}
          >
            <Send size={16} /> Submit Interview
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewSession;
