// JLPT Data Storage
let JLPT_DATA = [];
const QUIZ_SIZE = 20;

// App State
let quizQueue = [];
let currentQuestionIndex = 0;
let score = { correct: 0, wrong: 0 };
let wrongAnswers = [];

// DB Viewer State
let dbPage = 1;
const ITEMS_PER_PAGE = 5;

// DOM Elements
const views = {
    start: document.getElementById('view-start'),
    quiz: document.getElementById('view-quiz'),
    report: document.getElementById('view-report')
};

const els = {
    totalDbCount: document.getElementById('total-db-count'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnRestart: document.getElementById('btn-restart'),

    // DB View
    btnViewDb: document.getElementById('btn-view-db'),
    dbModal: document.getElementById('db-modal'),
    btnCloseDb: document.getElementById('btn-close-db'),
    dbListContainer: document.getElementById('db-list-container'),
    dbTotalCount: document.getElementById('db-total-count'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page'),
    pageIndicator: document.getElementById('page-indicator'),

    // Quiz View
    questionKanji: document.getElementById('question-kanji'),
    optionsContainer: document.getElementById('options-container'),
    progressContainer: document.getElementById('progress-container'),
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),

    // Report View
    scoreText: document.getElementById('score-text'),
    scoreCircle: document.getElementById('score-circle-path'),
    correctCount: document.getElementById('correct-count'),
    wrongCount: document.getElementById('wrong-count'),
    wrongSection: document.getElementById('wrong-answers-section'),
    wrongList: document.getElementById('wrong-items-list'),

    // Feedback Modal
    modal: document.getElementById('feedback-modal'),
    modalIcon: document.getElementById('feedback-icon'),
    modalTitle: document.getElementById('feedback-title'),
    fbKanji: document.getElementById('fb-kanji'),
    fbReading: document.getElementById('fb-reading'),
    fbMeaning: document.getElementById('fb-meaning'),
    fbExample: document.getElementById('fb-example'),
    btnNext: document.getElementById('btn-next')
};

// Initialization
async function init() {
    await loadData();
    setupEventListeners();
}

async function loadData() {
    try {
        const res = await fetch('jlpt_data.txt');
        const text = await res.text();
        parseData(text);
    } catch (e) {
        console.error("Failed to load data:", e);
        alert("데이터 로드 실패: jlpt_data.txt를 확인해주세요.");
    }
}

function parseData(text) {
    const lines = text.split('\n');
    JLPT_DATA = [];

    lines.forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 3) {
            JLPT_DATA.push({
                word: parts[0],
                reading: parts[1],
                meaning: parts[2],
                example: parts[3] || ""
            });
        }
    });

    els.totalDbCount.textContent = JLPT_DATA.length;
    els.dbTotalCount.textContent = JLPT_DATA.length;
}

function setupEventListeners() {
    els.btnStart.addEventListener('click', startQuiz);
    els.btnStop.addEventListener('click', () => finishQuiz(true));
    els.btnRestart.addEventListener('click', () => location.reload());
    els.btnNext.addEventListener('click', nextQuestion);

    // DB Modal
    els.btnViewDb.addEventListener('click', openDbModal);
    els.btnCloseDb.addEventListener('click', closeDbModal);
    els.btnPrevPage.addEventListener('click', () => changeDbPage(-1));
    els.btnNextPage.addEventListener('click', () => changeDbPage(1));

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === els.dbModal) closeDbModal();
    });
}

// Data Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// DB Viewer Logic
function openDbModal() {
    dbPage = 1;
    renderDbPage();
    els.dbModal.classList.remove('hidden');
}

function closeDbModal() {
    els.dbModal.classList.add('hidden');
}

function changeDbPage(delta) {
    const maxPage = Math.ceil(JLPT_DATA.length / ITEMS_PER_PAGE) || 1;
    const newPage = dbPage + delta;
    if (newPage >= 1 && newPage <= maxPage) {
        dbPage = newPage;
        renderDbPage();
    }
}

function renderDbPage() {
    els.dbListContainer.innerHTML = '';
    const startIdx = (dbPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageItems = JLPT_DATA.slice(startIdx, endIdx);

    pageItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        div.innerHTML = `
            <div style="font-size:1.2rem; font-weight:bold; color:var(--accent);">${startIdx + idx + 1}. ${item.word}</div>
            <div style="font-size:0.9rem; color:#ccc;">${item.reading}</div>
            <div style="margin-top:5px;">${item.meaning}</div>
        `;
        els.dbListContainer.appendChild(div);
    });

    const maxPage = Math.ceil(JLPT_DATA.length / ITEMS_PER_PAGE) || 1;
    els.pageIndicator.textContent = `${dbPage} / ${maxPage}`;
}

// Quiz Logic
function startQuiz() {
    if (JLPT_DATA.length === 0) {
        alert("데이터가 없습니다.");
        return;
    }

    // Prepare Queue (Random 20)
    // If data < 20, take all.
    const fullShuffled = shuffleArray([...JLPT_DATA]);
    quizQueue = fullShuffled.slice(0, Math.min(QUIZ_SIZE, fullShuffled.length));

    currentQuestionIndex = 0;
    score = { correct: 0, wrong: 0 };
    wrongAnswers = [];

    // UI Setup
    els.progressContainer.classList.remove('hidden');
    switchView('quiz');
    showQuestion();
}

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active', 'hidden'));
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    views[viewName].classList.add('active');
}

function showQuestion() {
    if (currentQuestionIndex >= quizQueue.length) {
        finishQuiz();
        return;
    }

    const item = quizQueue[currentQuestionIndex];
    const total = quizQueue.length;

    // Update Progress
    els.progressText.textContent = `${currentQuestionIndex + 1} / ${total}`;
    const pct = ((currentQuestionIndex) / total) * 100;
    els.progressFill.style.width = `${pct}%`;

    // Render Question
    els.questionKanji.textContent = item.word;

    // Generate Options
    const options = generateOptions(item);
    renderOptions(options, item);
}

function generateOptions(correctItem) {
    // Correct Option
    const correctOption = {
        text: correctItem.meaning,
        isCorrect: true,
        original: correctItem
    };

    // Distractors
    // Filter out the current item to avoid duplicate correct answers
    const otherItems = JLPT_DATA.filter(d => d.word !== correctItem.word);

    // Shuffle and pick 3
    const shuffledOthers = shuffleArray([...otherItems]);
    const distractors = shuffledOthers.slice(0, 3).map(item => ({
        text: item.meaning, // Distractor is Meaning
        isCorrect: false,
        original: item
    }));

    // If we don't have enough data (e.g. testing with < 4 items), handle gracefully
    // But user asks for 30 items so it should be fine.

    // Combine and Shuffle
    return shuffleArray([correctOption, ...distractors]);
}

function renderOptions(options, currentItem) {
    els.optionsContainer.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-choice';
        btn.innerHTML = `
            <span class="choice-label">${labels[idx]}</span>
            <span class="choice-text">${opt.text}</span>
        `;
        btn.onclick = () => handleAnswer(opt, currentItem);
        els.optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selectedOption, currentItem) {
    const isCorrect = selectedOption.isCorrect;

    if (isCorrect) {
        score.correct++;
        showFeedbackModal(true, currentItem);
    } else {
        score.wrong++;
        wrongAnswers.push({
            question: currentItem,
            selected: selectedOption.text
        });
        showFeedbackModal(false, currentItem);
    }
}

function showFeedbackModal(isCorrect, item) {
    els.modal.classList.remove('hidden');

    if (isCorrect) {
        els.modalIcon.textContent = '✅';
        els.modalTitle.textContent = '정답입니다!';
        els.modalTitle.style.color = 'var(--correct)';
    } else {
        els.modalIcon.textContent = '❌';
        els.modalTitle.textContent = '아쉽네요...';
        els.modalTitle.style.color = 'var(--wrong)';
    }

    els.fbKanji.textContent = item.word;
    els.fbReading.textContent = item.reading;
    els.fbMeaning.textContent = item.meaning;
    els.fbExample.textContent = item.example || "";
}

function nextQuestion() {
    els.modal.classList.add('hidden');
    currentQuestionIndex++;
    showQuestion();
}

function finishQuiz(earlyExit = false) {
    els.progressContainer.classList.add('hidden');
    switchView('report');

    const totalAnswered = score.correct + score.wrong;
    if (totalAnswered === 0 && earlyExit) {
        els.scoreText.textContent = "0%";
        els.correctCount.textContent = 0;
        els.wrongCount.textContent = 0;
        return;
    }

    const percentage = Math.round((score.correct / totalAnswered) * 100) || 0;
    els.scoreText.textContent = `${percentage}%`;

    els.scoreCircle.style.strokeDashoffset = 100 - percentage;
    if (percentage >= 80) els.scoreCircle.style.stroke = 'var(--correct)';
    else if (percentage >= 50) els.scoreCircle.style.stroke = 'var(--accent)';
    else els.scoreCircle.style.stroke = 'var(--wrong)';

    els.correctCount.textContent = score.correct;
    els.wrongCount.textContent = score.wrong;

    if (wrongAnswers.length > 0) {
        els.wrongSection.classList.remove('hidden');
        els.wrongList.innerHTML = '';
        wrongAnswers.forEach(wa => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="font-weight:bold; margin-bottom:5px;">${wa.question.word} [${wa.question.reading}]</div>
                <div style="color:#aaa; font-size:0.9rem;">정답: ${wa.question.meaning}</div>
                <div style="color:var(--wrong); font-size:0.9rem;">선택: ${wa.selected}</div>
            `;
            els.wrongList.appendChild(li);
        });
    } else {
        els.wrongSection.classList.add('hidden');
    }
}

init();
