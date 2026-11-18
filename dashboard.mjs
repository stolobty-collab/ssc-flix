import { createStudyStore, questions, summarise } from './study-store.mjs';

const byId = id => document.getElementById(id);
const panel = byId('panel');
const panelTitle = byId('panel-title');
const body = byId('panel-body');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const store = createStudyStore(storage);

const activities = {
  mock: ['Mock Tests', 'Full-length and sectional mock tests will appear here when the catalogue is added.'],
  pyq: ['PYQs', 'Previous-year papers will be grouped by exam, year and shift when the catalogue is added.'],
  chapter: ['Chapter Tests', 'Try Number Analogy, a short sample from General Intelligence & Reasoning.'],
};

function button(label, action, className = 'button') {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', action);
  return element;
}

function paragraph(copy, className) {
  const element = document.createElement('p');
  element.textContent = copy;
  if (className) element.className = className;
  return element;
}

function openPanel(title, ...content) {
  const alreadyOpen = panel.open;
  panelTitle.textContent = title;
  body.replaceChildren(...content);
  if (alreadyOpen) {
    panelTitle.tabIndex = -1;
    panelTitle.focus();
  } else {
    panel.showModal();
  }
}

function getAttempt() {
  const { exam, attempts } = store.getState();
  return attempts[exam];
}

function saveAttempt(attempt) {
  const { exam, attempts } = store.getState();
  const persisted = store.update({ attempts: { ...attempts, [exam]: attempt } });
  renderDashboard();
  return persisted;
}

function renderDashboard() {
  const { exam, theme } = store.getState();
  const attempt = getAttempt();
  const { checked, accuracy } = summarise(attempt);
  document.documentElement.dataset.theme = theme;
  byId('exam').value = exam;
  byId('theme').setAttribute('aria-pressed', String(theme === 'dark'));
  byId('theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
  byId('dashboard-context').textContent = `Your ${exam} study workspace`;
  byId('continue-label').textContent = attempt?.completed ? 'Practice complete' : attempt ? 'Continue learning' : 'Your next practice';
  byId('continue-description').textContent = attempt?.completed ? 'See your score and review the answers.' : attempt ? 'Pick up where you left off.' : 'Try a short sample set and get feedback on every answer.';
  byId('continue-action').textContent = attempt?.completed ? 'View practice summary' : attempt ? 'Resume practice' : 'Start sample practice';
  byId('progress-count').textContent = `${checked} of ${questions.length}`;
  byId('continue-meter').max = questions.length;
  byId('continue-meter').value = checked;
  byId('sessions').textContent = attempt?.completed ? '1' : '0';
  byId('checked').textContent = checked;
  byId('accuracy').textContent = accuracy === null ? '—' : `${accuracy}%`;
  const recent = byId('recent');
  recent.replaceChildren(paragraph(attempt?.completed ? 'Number Analogy · Completed' : attempt ? 'Number Analogy · In progress' : 'Your first practice session will appear here.'));
  if (attempt) recent.append(button(attempt.completed ? 'View summary' : 'Resume', openPractice, 'button quiet'));
}

function renderSummary(attempt) {
  const { checked, correct, accuracy } = summarise(attempt);
  const details = questions.map((question, index) => {
    const entry = attempt.answers[index];
    const status = entry?.checked ? entry.choice === question.answer ? 'Correct' : 'Incorrect' : 'Skipped';
    return paragraph(`Question ${index + 1} · ${status}. ${question.explanation}`);
  });
  openPanel('Number Analogy summary', paragraph(`${correct} correct · ${checked - correct} incorrect · ${questions.length - checked} skipped`), paragraph(accuracy === null ? 'No answers checked' : `${accuracy}% accuracy`), ...details, button('Back to dashboard', () => panel.close(), 'button primary'));
}

function openPractice() {
  const attempt = getAttempt() ?? { current: 0, answers: [], completed: false };
  if (attempt.completed) {
    renderSummary(attempt);
    return;
  }

  const question = questions[attempt.current];
  const existing = attempt.answers[attempt.current];
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = question.prompt;
  fieldset.append(legend);
  fieldset.disabled = Boolean(existing?.checked);
  const checkAnswer = button('Check answer', () => {
    const current = getAttempt();
    if (current?.answers[attempt.current]?.choice === undefined) return;
    const persisted = saveAttempt({ ...current, answers: current.answers.map((entry, index) => index === attempt.current ? { ...entry, checked: true } : entry) });
    openPractice();
    if (!persisted) body.append(paragraph('Progress is available for this visit. This browser could not save it for later.'));
  }, 'button primary');
  checkAnswer.disabled = existing?.choice === undefined;

  question.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'choice';
    input.checked = existing?.choice === index;
    input.addEventListener('change', () => {
      const answers = [...(getAttempt()?.answers ?? [])];
      answers[attempt.current] = { choice: index, checked: false };
      const persisted = saveAttempt({ ...attempt, answers });
      checkAnswer.disabled = false;
      saveStatus.textContent = persisted ? '' : 'This browser could not save your draft for later.';
    });
    label.append(input, option);
    fieldset.append(label);
  });

  const saveStatus = paragraph('');
  saveStatus.setAttribute('role', 'status');
  const content = [paragraph(`Practice Mode · Question ${attempt.current + 1} of ${questions.length}`), fieldset, saveStatus];
  if (existing?.checked) {
    const correct = existing.choice === question.answer;
    const feedback = paragraph(`${correct ? 'Correct.' : 'Incorrect.'} ${question.explanation}`, correct ? 'feedback' : 'feedback incorrect');
    const final = attempt.current === questions.length - 1;
    content.push(feedback, button(final ? 'Finish practice' : 'Next question', () => {
      const persisted = saveAttempt({ ...getAttempt(), current: final ? attempt.current : attempt.current + 1, completed: final });
      openPractice();
      if (!persisted) body.append(paragraph('This browser could not save your progress for later.'));
    }, 'button primary'));
  } else {
    content.push(checkAnswer);
  }
  openPanel('Number Analogy', ...content);
}

function openActivity(key) {
  const [title, description] = activities[key];
  if (key === 'chapter') {
    openPanel(title, paragraph(description), button('Open Number Analogy', openPractice, 'button primary'));
  } else {
    openPanel(title, paragraph(description), button('Back to dashboard', () => panel.close()));
  }
}

function openWorkspacePanel(key) {
  if (key === 'preferences') {
    const themeButton = button('Toggle dark mode', () => {
      byId('theme').click();
      themeButton.setAttribute('aria-pressed', String(store.getState().theme === 'dark'));
    });
    themeButton.setAttribute('aria-pressed', String(store.getState().theme === 'dark'));
    openPanel('Preferences', paragraph('Choose the appearance of this device.'), themeButton);
  } else if (key === 'history') {
    const attempt = getAttempt();
    openPanel('My Tests', paragraph(attempt ? 'Number Analogy · ' + (attempt.completed ? 'Completed' : 'In progress') : 'No attempts for ' + store.getState().exam + '.'),
      attempt ? button(attempt.completed ? 'View practice summary' : 'Resume practice', openPractice, 'button primary') : button('Back to dashboard', () => panel.close()));
  } else {
    openPanel('More', button('My Tests', () => openWorkspacePanel('history')), button('Preferences', () => openWorkspacePanel('preferences')));
  }
}

byId('exam').addEventListener('change', event => {
  store.update({ exam: event.target.value });
  renderDashboard();
});
byId('theme').addEventListener('click', () => {
  store.update({ theme: store.getState().theme === 'dark' ? 'light' : 'dark' });
  renderDashboard();
});
byId('continue-action').addEventListener('click', openPractice);
document.querySelectorAll('[data-activity]').forEach(element => element.addEventListener('click', () => openActivity(element.dataset.activity)));
document.querySelectorAll('[data-panel]').forEach(element => element.addEventListener('click', () => openWorkspacePanel(element.dataset.panel)));
renderDashboard();
