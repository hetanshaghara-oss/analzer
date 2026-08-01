import { useEffect, useState } from 'react';

/**
 * Cycles through `words`, typing then deleting each one.
 * Returns the current partial string.
 */
export function useTypewriter(words, { typeSpeed = 75, deleteSpeed = 38, pause = 1700 } = {}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index % words.length];

    // Fully typed — hold before deleting
    if (!deleting && subIndex === word.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }

    // Fully deleted — move to next word
    if (deleting && subIndex === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return undefined;
    }

    const t = setTimeout(
      () => setSubIndex((s) => s + (deleting ? -1 : 1)),
      deleting ? deleteSpeed : typeSpeed
    );
    return () => clearTimeout(t);
  }, [subIndex, deleting, index, words, typeSpeed, deleteSpeed, pause]);

  return words[index % words.length].slice(0, subIndex);
}
