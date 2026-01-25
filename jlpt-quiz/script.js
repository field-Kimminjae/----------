// JLPT Data (Initial Sample)
const JLPT_DATA = [
    { word: "勉強", reading: "べんきょう", meaning: "공부", example: "毎日勉強します。" },
    { word: "食べる", reading: "たべる", meaning: "먹다", example: "ご飯を食べる。" },
    { word: "忙しい", reading: "いそがしい", meaning: "바쁘다", example: "今日は忙しいです。" },
    { word: "綺麗", reading: "きれい", meaning: "깨끗하다, 예쁘다", example: "部屋が綺麗です。" },
    { word: "読む", reading: "よむ", meaning: "읽다", example: "本を読む。" }
];

// App State
let quizQueue = [];
let currentQuestionIndex = 0;
let score = { correct: 0, wrong: 0 };
let wrongAnswers = []; // Stores { questionItem, selectedOption }

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

    // Modal
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
function init() {
    els.totalDbCount.textContent = JLPT_DATA.length;

    els.btnStart.addEventListener('click', startQuiz);
    els.btnStop.addEventListener('click', () => finishQuiz(true));
    els.btnRestart.addEventListener('click', () => location.reload()); // Simple reload for restart
    els.btnNext.addEventListener('click', nextQuestion);
}

// Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active', 'hidden'));
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    views[viewName].classList.add('active');
}

// Quiz Logic
function startQuiz() {
    // Reset State
    quizQueue = shuffleArray([...JLPT_DATA]); // Shuffle all data
    currentQuestionIndex = 0;
    score = { correct: 0, wrong: 0 };
    wrongAnswers = [];

    // UI Setup
    showProgress();
    switchView('quiz');
    els.progressContainer.classList.remove('hidden'); // Show progress bar in header

    showQuestion();
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

    // Generate Options (1 Correct + 3 Distractors)
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
    // Get all other items
    const otherItems = JLPT_DATA.filter(d => d.word !== correctItem.word);

    // Shuffle and pick 3
    const shuffledOthers = shuffleArray([...otherItems]);
    const distractors = shuffledOthers.slice(0, 3).map(item => ({
        text: item.meaning,
        isCorrect: false,
        original: item
    }));

    // Combine and Shuffle
    return shuffleArray([correctOption, ...distractors]);
}

function renderOptions(options, currentItem) {
    els.optionsContainer.innerHTML = ''; // Clear prev options

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
    // Logic: User cannot change answer once clicked? Or show immediate feedback?
    // User requested "4-choice engine". Typical flow: click -> modal feedback -> next.

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

    // Populate Details
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

    // Calculate Score
    const totalAnswered = score.correct + score.wrong;
    if (totalAnswered === 0 && earlyExit) {
        els.scoreText.textContent = "0%";
        els.correctCount.textContent = 0;
        els.wrongCount.textContent = 0;
        return;
    }

    const percentage = Math.round((score.correct / totalAnswered) * 100) || 0;
    els.scoreText.textContent = `${percentage}%`;

    // Animate Circle
    // Stroke Dasharray: 100. Offset: 100 - percentage.
    els.scoreCircle.style.strokeDashoffset = 100 - percentage;
    if (percentage >= 80) els.scoreCircle.style.stroke = 'var(--correct)';
    else if (percentage >= 50) els.scoreCircle.style.stroke = 'var(--accent)';
    else els.scoreCircle.style.stroke = 'var(--wrong)';

    els.correctCount.textContent = score.correct;
    els.wrongCount.textContent = score.wrong;

    // Wrong Answers List
    if (wrongAnswers.length > 0) {
        els.wrongSection.classList.remove('hidden');
        els.wrongList.innerHTML = '';
        wrongAnswers.forEach(wa => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong style="color:white; font-size:1.1rem;">${wa.question.word}</strong> 
                <span style="color:var(--accent); margin-left:5px;">${wa.question.reading}</span><br>
                <span style="color:#aaa;">정답: ${wa.question.meaning}</span><br>
                <span style="color:var(--wrong); font-size:0.9rem;">(선택: ${wa.selected})</span>
            `;
            els.wrongList.appendChild(li);
        });
    } else {
        els.wrongSection.classList.add('hidden');
    }
}

// Run
init();
