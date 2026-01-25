// ------------------------------------------------------------------
// Global Logic & Data Loading
// ------------------------------------------------------------------

let basicData = [];
let advancedData = [];

// Managers
let leftQuiz = null;
let rightQuiz = null;

const ITEMS_PER_PAGE = 5;

// Init
async function init() {
    await loadData();

    // Initialize Managers
    leftQuiz = new QuizManager('left', basicData, {
        highlightSynonyms: false,
        themeColor: 'var(--accent)'
    });

    rightQuiz = new QuizManager('right', advancedData, {
        highlightSynonyms: true,
        themeColor: 'var(--accent-purple)'
    });

    console.log("Phase 3: Quiz Engines Initialized.");
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
    basicData = [];
    advancedData = [];

    lines.forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length < 3) return;

        const item = {
            word: parts[0],
            reading: parts[1],
            meaning: parts[2],
            other: parts[3] || ""
        };

        // Classification: Presence of '≒' or '≈' goes to Advanced (Right)
        if (item.meaning.includes('≒') || item.meaning.includes('≈')) {
            advancedData.push(item);
        } else {
            basicData.push(item);
        }
    });

    // Initial Count UI
    if (document.getElementById('left-total-db-count'))
        document.getElementById('left-total-db-count').textContent = basicData.length;
    if (document.getElementById('right-total-db-count'))
        document.getElementById('right-total-db-count').textContent = advancedData.length;
}

// ------------------------------------------------------------------
// QuizManager Class (Independent Engine)
// ------------------------------------------------------------------
class QuizManager {
    constructor(panelPrefix, data, options = {}) {
        this.prefix = panelPrefix;
        this.data = data || [];
        this.options = options; // { highlightSynonyms: boolean, themeColor: string }

        // State
        this.quizQueue = [];
        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0 };
        this.wrongAnswers = [];
        this.dbPage = 1;

        // Cache DOM Elements (using prefix)
        this.els = {
            viewStart: document.getElementById(`${this.prefix}-view-start`),
            viewQuiz: document.getElementById(`${this.prefix}-view-quiz`),
            viewReport: document.getElementById(`${this.prefix}-view-report`),

            totalDbCount: document.getElementById(`${this.prefix}-total-db-count`),

            btnStart: document.getElementById(`${this.prefix}-btn-start`),
            btnStop: document.getElementById(`${this.prefix}-btn-stop`),
            btnRestart: document.getElementById(`${this.prefix}-btn-restart`),

            // Quiz UI
            questionArea: document.getElementById(`${this.prefix}-question-area`),
            questionKanji: document.getElementById(`${this.prefix}-question-kanji`),
            optionsContainer: document.getElementById(`${this.prefix}-options-container`),

            progressContainer: document.getElementById(`${this.prefix}-progress-container`),
            progressText: document.getElementById(`${this.prefix}-progress-text`),
            progressFill: document.getElementById(`${this.prefix}-progress-fill`),

            // Report UI
            scoreText: document.getElementById(`${this.prefix}-score-text`),
            scoreCircle: document.getElementById(`${this.prefix}-score-circle-path`),
            correctCount: document.getElementById(`${this.prefix}-correct-count`),
            wrongCount: document.getElementById(`${this.prefix}-wrong-count`),
            wrongSection: document.getElementById(`${this.prefix}-wrong-answers-section`),
            wrongList: document.getElementById(`${this.prefix}-wrong-items-list`),

            // DB Modal UI
            btnViewDb: document.getElementById(`${this.prefix}-btn-view-db`),
            dbModal: document.getElementById(`${this.prefix}-db-modal`),
            btnCloseDb: document.getElementById(`${this.prefix}-btn-close-db`),
            dbListContainer: document.getElementById(`${this.prefix}-db-list-container`),
            dbTotalCount: document.getElementById(`${this.prefix}-db-total-count`),
            btnPrevPage: document.getElementById(`${this.prefix}-btn-prev-page`),
            btnNextPage: document.getElementById(`${this.prefix}-btn-next-page`),
            pageIndicator: document.getElementById(`${this.prefix}-page-indicator`),

            // Feedback Modal
            feedbackModal: document.getElementById(`${this.prefix}-feedback-modal`),
            fbIcon: document.getElementById(`${this.prefix}-feedback-icon`),
            fbTitle: document.getElementById(`${this.prefix}-feedback-title`),
            fbKanji: document.getElementById(`${this.prefix}-fb-kanji`),
            fbReading: document.getElementById(`${this.prefix}-fb-reading`),
            fbMeaning: document.getElementById(`${this.prefix}-fb-meaning`),
            fbExample: document.getElementById(`${this.prefix}-fb-example`),
            btnNext: document.getElementById(`${this.prefix}-btn-next`),
        };

        this.attachEvents();
    }

    attachEvents() {
        if (!this.els.btnStart) return;

        this.els.btnStart.addEventListener('click', () => this.startQuiz());
        this.els.btnStop.addEventListener('click', () => this.finishQuiz(true));
        this.els.btnRestart.addEventListener('click', () => {
            // Soft reset without reload if possible, or reload just resets everything. 
            // Since we have two managers, reload kills both. 
            // Better to implement soft reset.
            this.switchView('start');
        });

        // Feedback Modal
        this.els.btnNext.addEventListener('click', () => this.nextQuestion());

        // DB Modal
        this.els.btnViewDb.addEventListener('click', () => this.openDbModal());
        this.els.btnCloseDb.addEventListener('click', () => this.closeDbModal());
        this.els.btnPrevPage.addEventListener('click', () => this.changeDbPage(-1));
        this.els.btnNextPage.addEventListener('click', () => this.changeDbPage(1));

        // Outside click for DB modal
        window.addEventListener('click', (e) => {
            if (e.target === this.els.dbModal) this.closeDbModal();
        });
    }

    // ----------------------
    // View Logic
    // ----------------------
    switchView(viewName) { // 'start', 'quiz', 'report'
        const views = [this.els.viewStart, this.els.viewQuiz, this.els.viewReport];
        views.forEach(v => v.classList.remove('active', 'hidden'));
        views.forEach(v => v.classList.add('hidden'));

        if (viewName === 'start') this.els.viewStart.classList.remove('hidden');
        if (viewName === 'quiz') this.els.viewQuiz.classList.remove('hidden');
        if (viewName === 'report') this.els.viewReport.classList.remove('hidden');

        // Always remove active from all first
        views.forEach(v => {
            if (!v.classList.contains('hidden')) v.classList.add('active');
        });
    }

    // ----------------------
    // Quiz Flow
    // ----------------------
    startQuiz() {
        if (this.data.length === 0) {
            alert("데이터가 없습니다. (Data is empty)");
            return;
        }

        const QUIZ_SIZE = 20;
        const shuffled = this.shuffle([...this.data]);
        this.quizQueue = shuffled.slice(0, Math.min(QUIZ_SIZE, shuffled.length));

        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0 };
        this.wrongAnswers = [];

        this.els.progressContainer.classList.remove('hidden');
        this.switchView('quiz');
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentIndex >= this.quizQueue.length) {
            this.finishQuiz();
            return;
        }

        const item = this.quizQueue[this.currentIndex];
        const total = this.quizQueue.length;

        // Progress
        this.els.progressText.textContent = `${this.currentIndex + 1} / ${total}`;
        const pct = ((this.currentIndex) / total) * 100;
        this.els.progressFill.style.width = `${pct}%`;

        // Question
        this.els.questionKanji.textContent = item.word;

        // Options
        const options = this.generateOptions(item);
        this.renderOptionButtons(options, item);
    }

    generateOptions(correctItem) {
        // Distractors come from the SAME pool (Basic->Basic, Advanced->Advanced)
        // Correct Option
        const correctOption = {
            text: correctItem.meaning,
            isCorrect: true,
            original: correctItem
        };

        const otherItems = this.data.filter(d => d.word !== correctItem.word);
        const distractors = this.shuffle([...otherItems]).slice(0, 3).map(item => ({
            text: item.meaning,
            isCorrect: false,
            original: item
        }));

        return this.shuffle([correctOption, ...distractors]);
    }

    renderOptionButtons(options, currentItem) {
        this.els.optionsContainer.innerHTML = '';
        const labels = ['A', 'B', 'C', 'D'];

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn-choice';
            btn.innerHTML = `
                <span class="choice-label">${labels[idx]}</span>
                <span class="choice-text">${opt.text}</span>
            `;
            btn.onclick = () => this.handleAnswer(opt, currentItem);
            this.els.optionsContainer.appendChild(btn);
        });
    }

    handleAnswer(selectedOption, currentItem) {
        const isCorrect = selectedOption.isCorrect;

        if (isCorrect) {
            this.score.correct++;
            this.showFeedback(true, currentItem);
        } else {
            this.score.wrong++;
            this.wrongAnswers.push({
                question: currentItem,
                selected: selectedOption.text
            });
            this.showFeedback(false, currentItem);
        }
    }

    showFeedback(isCorrect, item) {
        this.els.feedbackModal.classList.remove('hidden');

        if (isCorrect) {
            this.els.fbIcon.textContent = '✅';
            this.els.fbTitle.textContent = 'Correct!';
            this.els.fbTitle.style.color = 'var(--correct)';
        } else {
            this.els.fbIcon.textContent = '❌';
            this.els.fbTitle.textContent = 'Incorrect...';
            this.els.fbTitle.style.color = 'var(--wrong)';
        }

        this.els.fbKanji.textContent = item.word;
        this.els.fbReading.textContent = item.reading;

        // Advanced Logic: Highlight synonyms if available
        if (this.options.highlightSynonyms) {
            // Replace '≒' with a highlighted span if needed, or just let CSS do it.
            // But let's make it clearer.
            let meaningDisplay = item.meaning;
            if (meaningDisplay.includes('≒')) {
                meaningDisplay = meaningDisplay.replace('≒', '<br><span style="color:#d8b4fe; font-weight:bold;">≒</span>');
            }
            this.els.fbMeaning.innerHTML = meaningDisplay;
        } else {
            this.els.fbMeaning.textContent = item.meaning;
        }

        this.els.fbExample.textContent = item.example || "";
    }

    nextQuestion() {
        this.els.feedbackModal.classList.add('hidden');
        this.currentIndex++;
        this.renderQuestion();
    }

    finishQuiz(earlyExit = false) {
        this.els.progressContainer.classList.add('hidden');
        this.switchView('report');

        const totalAnswered = this.score.correct + this.score.wrong;
        if (totalAnswered === 0 && earlyExit) {
            this.els.scoreText.textContent = "0%";
            this.els.correctCount.textContent = 0;
            this.els.wrongCount.textContent = 0;
            return;
        }

        const percentage = Math.round((this.score.correct / totalAnswered) * 100) || 0;
        this.els.scoreText.textContent = `${percentage}%`;

        // Circle Animation
        this.els.scoreCircle.style.strokeDashoffset = 100 - percentage;

        let strokeColor = 'var(--wrong)';
        if (percentage >= 80) strokeColor = 'var(--correct)';
        else if (percentage >= 50) strokeColor = this.options.themeColor;

        this.els.scoreCircle.style.stroke = strokeColor;

        this.els.correctCount.textContent = this.score.correct;
        this.els.wrongCount.textContent = this.score.wrong;

        // Wrong List
        if (this.wrongAnswers.length > 0) {
            this.els.wrongSection.classList.remove('hidden');
            this.els.wrongList.innerHTML = '';
            this.wrongAnswers.forEach(wa => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div style="font-weight:bold; margin-bottom:5px;">${wa.question.word} [${wa.question.reading}]</div>
                    <div style="color:#aaa; font-size:0.9rem;">정답: ${wa.question.meaning}</div>
                    <div style="color:var(--wrong); font-size:0.9rem;">선택: ${wa.selected}</div>
                `;
                this.els.wrongList.appendChild(li);
            });
        } else {
            this.els.wrongSection.classList.add('hidden');
        }
    }

    // ----------------------
    // DB Modal Logic
    // ----------------------
    openDbModal() {
        this.dbPage = 1;
        this.els.dbTotalCount.textContent = this.data.length;
        this.renderDbPage();
        this.els.dbModal.classList.remove('hidden');
    }

    closeDbModal() {
        this.els.dbModal.classList.add('hidden');
    }

    changeDbPage(delta) {
        const maxPage = Math.ceil(this.data.length / ITEMS_PER_PAGE) || 1;
        const newPage = this.dbPage + delta;
        if (newPage >= 1 && newPage <= maxPage) {
            this.dbPage = newPage;
            this.renderDbPage();
        }
    }

    renderDbPage() {
        this.els.dbListContainer.innerHTML = '';
        const startIdx = (this.dbPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const pageItems = this.data.slice(startIdx, endIdx);

        pageItems.forEach((item, idx) => {
            const div = document.createElement('div');
            div.style.padding = "10px";
            div.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

            // Advanced formatting
            let meaningHtml = item.meaning;
            if (this.options.highlightSynonyms && meaningHtml.includes('≒')) {
                meaningHtml = meaningHtml.replace('≒', '<span style="color:#d8b4fe;">≒</span>');
            }

            div.innerHTML = `
                <div style="font-size:1.1rem; font-weight:bold; color:${this.options.themeColor};">${startIdx + idx + 1}. ${item.word}</div>
                <div style="font-size:0.9rem; color:#ccc;">${item.reading}</div>
                <div style="margin-top:5px; font-size:0.95rem;">${meaningHtml}</div>
            `;
            this.els.dbListContainer.appendChild(div);
        });

        const maxPage = Math.ceil(this.data.length / ITEMS_PER_PAGE) || 1;
        this.els.pageIndicator.textContent = `${this.dbPage} / ${maxPage}`;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

init();
