export const exams = ['SSC CGL', 'SSC CHSL', 'SSC GD'];
export const questions = [
  { prompt: 'Choose the number that completes the analogy. 7 : 50 :: 9 : ?', options: ['72', '80', '82', '90'], answer: 2, explanation: 'Square the first number and add 1. Since 7² + 1 = 50, the missing number is 9² + 1 = 82.' },
  { prompt: 'Complete the analogy. 8 : 64 :: 12 : ?', options: ['96', '120', '132', '144'], answer: 3, explanation: 'The second number is the square of the first. 12² = 144.' },
  { prompt: 'Find the missing number. 4 : 20 :: 6 : ?', options: ['30', '36', '42', '48'], answer: 2, explanation: 'Multiply the first number by its successor. 4 × 5 = 20 and 6 × 7 = 42.' },
];

export function createStudyStore(storage) {
  const key = 'ssc-flix.workspace.v1';
  let state = { theme: 'light', exam: exams[0], attempts: {} };
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (exams.includes(saved?.exam) && ['light', 'dark'].includes(saved.theme) && saved.attempts && typeof saved.attempts === 'object') state = saved;
  } catch {
    // The page remains usable when storage is unavailable.
  }
  return {
    getState: () => state,
    update(patch) {
      state = { ...state, ...patch };
      try {
        storage.setItem(key, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function summarise(attempt) {
  const checked = attempt?.answers?.filter(entry => entry?.checked)?.length ?? 0;
  const correct = attempt?.answers?.filter((entry, index) => entry?.checked && entry.choice === questions[index]?.answer)?.length ?? 0;
  return { checked, correct, accuracy: checked ? Math.round(correct / checked * 100) : null };
}
