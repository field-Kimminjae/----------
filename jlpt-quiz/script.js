// JLPT Data (Initial Sample)
const JLPT_DATA = [
    { word: "騒然とする", reading: "そうぜんとする", meaning: "소연해지다 (떠들썩하다)", example: "" },
    { word: "秩序", reading: "ちつじょ", meaning: "질서", example: "" },
    { word: "朗らかな", reading: "ほがらかな", meaning: "명랑한, 쾌활한", example: "" },
    { word: "軌跡", reading: "きせき", meaning: "궤적", example: "" },
    { word: "矛盾", reading: "むじゅん", meaning: "모순", example: "" },
    { word: "賄う", reading: "まかなう", meaning: "조달하다, 마련하다", example: "" },
    { word: "諭す", reading: "さとす", meaning: "타이르다", example: "" },
    { word: "潜伏", reading: "せんぷく", meaning: "잠복", example: "" },
    { word: "振興", reading: "しんこう", meaning: "진흥", example: "" },
    { word: "偏り", reading: "かたより", meaning: "치우침, 편향", example: "" },
    { word: "誇張", reading: "こちょう", meaning: "과장", example: "" },
    { word: "軽率な", reading: "けいそつな", meaning: "경솔한", example: "" },
    { word: "勇敢に", reading: "ゆうかんに", meaning: "용감하게", example: "" },
    { word: "慕う", reading: "したう", meaning: "그리워하다, 우러르다", example: "" },
    { word: "沈下", reading: "ちんか", meaning: "침하", example: "" },
    { word: "監督", reading: "かんとく", meaning: "감독", example: "" },
    { word: "透ける", reading: "すける", meaning: "비쳐 보이다", example: "" },
    { word: "臨む", reading: "のぞむ", meaning: "임하다, 마주하다", example: "" },
    { word: "忠告", reading: "ちゅうこく", meaning: "충고", example: "" },
    { word: "施錠", reading: "せじょう", meaning: "시정 (문잠금)", example: "" },
    { word: "阻まれる", reading: "はばまれる", meaning: "저지당하다, 가로막히다", example: "" },
    { word: "派生", reading: "はせい", meaning: "파생", example: "" },
    { word: "恩恵", reading: "おんけい", meaning: "은혜", example: "" },
    { word: "如実に", reading: "にょじつに", meaning: "여실히 (사실과 똑같이)", example: "" },
    { word: "錯覚", reading: "さっかく", meaning: "착각", example: "" },
    { word: "枯渇", reading: "こかつ", meaning: "고갈", example: "" },
    { word: "克明に", reading: "こくめいに", meaning: "극명하게 (자세히)", example: "" },
    { word: "尊い", reading: "とうとい", meaning: "소중하다, 고귀하다", example: "" },
    { word: "慰める", reading: "なぐさめる", meaning: "위로하다", example: "" },
    { word: "緊迫した", reading: "きんぱくした", meaning: "긴박한", example: "" }
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
