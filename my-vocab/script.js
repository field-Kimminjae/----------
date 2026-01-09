/**
 * TOEIC Dual Quiz Master
 * Refactored for Side-by-Side Layout
 */

// 1. Data Sources

// Left: Existing Raw Data
const INITIAL_DATA_RAW = [];

// Right: New Dummy Data
const VOCAB_QUIZ_DATA = [
    { sentence: "I want to _______ my English.", word: "improve", answer: "O", explanation: "문맥상 적절합니다." }
];

/**
 * QuizGame Class
 * Encapsulates logic for a single quiz instance.
 */
class QuizGame {
    constructor(prefix, type, data) {
        this.prefix = prefix; // 'collo-' or 'vocab-'
        this.type = type;     // 'collo' or 'vocab'
        this.rawData = data;

        // State
        this.list = [];
        this.questions = [];
        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0, wrongItems: [] };
        this.maxQuestions = 20;
        this.isReviewMode = false;
        this.isWaiting = false; // For 1.5s delay
        this.timer = null;

        // Pagination State
        this.dbCurrentPage = 1;
        this.dbItemsPerPage = 5;

        // UI References
        this.ui = this.safeGetUI(prefix);
        if (!this.ui) {
            console.error(`[Critical] Failed to initialize UI for ${prefix}. missing elements.`);
            return;
        }

        this.init();
    }

    safeGetUI(prefix) {
        try {
            const get = (id) => document.getElementById(id);
            return {
                container: get(`${prefix}app`), // Main container
                viewStart: get(`${prefix}start-view`),
                viewQuiz: get(`${prefix}quiz-view`),
                viewReport: get(`${prefix}report-view`),

                progressContainer: get(`${prefix}progress-container`),
                progressText: get(`${prefix}progress-text`),
                progressFill: get(`${prefix}progress-fill`),

                questionText: get(`${prefix}question-text`),
                totalItemsCount: get(`${prefix}total-items-count`),

                modalFeedback: get(`${prefix}feedback-modal`),
                feedbackIcon: get(`${prefix}feedback-icon`),
                feedbackTitle: get(`${prefix}feedback-title`),
                feedbackReason: get(`${prefix}feedback-reason`),
                btnNext: get(`${prefix}btn-next`),

                circlePath: get(`${prefix}score-circle-path`),
                scoreText: get(`${prefix}score-text`),
                correctCount: get(`${prefix}correct-count`),
                wrongCount: get(`${prefix}wrong-count`),
                wrongSection: get(`${prefix}wrong-answers-section`),
                wrongList: get(`${prefix}wrong-items-list`),

                btnStart: get(`${prefix}btn-start`),
                btnReview: get(`${prefix}btn-review`), // New Review Button
                btnRestart: get(`${prefix}btn-restart`),
                btnStop: get(`${prefix}btn-stop`),

                actionButtons: document.querySelectorAll(`#${prefix}quiz-view .btn-ox`),

                // Data Modal (Optional)
                btnData: get(`${prefix}btn-data`),
                btnViewDB: get(`${prefix}btn-view-db`), // NEW: View DB Button

                modalData: get(`${prefix}data-modal`),
                inputData: get(`${prefix}data-input`),
                btnSaveData: get(`${prefix}btn-save-data`),
                btnCancelData: get(`${prefix}btn-cancel-data`),

                modalDB: get(`${prefix}db-modal`), // NEW: DB View Modal
                dbList: get(`${prefix}db-list`),   // NEW: DB List Container
                btnCloseDB: get(`${prefix}btn-close-db`), // NEW: Close DB Button

                // Pagination UI
                btnDBPrev: get(`${prefix}btn-db-prev`),
                btnDBNext: get(`${prefix}btn-db-next`),
                dbPageInfo: get(`${prefix}db-page-info`),
            };
        } catch (e) {
            console.error("UI Binding Error:", e);
            return null;
        }
    }

    init() {
        this.loadData();
        this.checkReviewAvailability();
        this.bindEvents();
    }

    loadData() {
        let baseData = [];
        if (this.type === 'collo') {
            // Check if rawData is an array (for Personal Master Custom) or old string
            if (Array.isArray(this.rawData)) {
                baseData = [...this.rawData];
            } else {
                baseData = this.parseColloData(this.rawData);
            }
        } else {
            baseData = [...this.rawData];
        }

        const userData = this.loadUserAddedData();
        this.list = [...baseData, ...userData];

        if (this.ui.totalItemsCount) this.ui.totalItemsCount.innerText = this.list.length;
    }

    loadUserAddedData() {
        const key = `personal_toeic_user_data_${this.type}`; // 'personal_' prefix to distinguish from root app
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    saveUserAddedData(newItems) {
        if (!newItems || newItems.length === 0) return;
        const key = `personal_toeic_user_data_${this.type}`;
        const current = this.loadUserAddedData();
        const merged = [...current, ...newItems];
        localStorage.setItem(key, JSON.stringify(merged));
    }

    updateTotalCountUI() {
        if (this.ui.totalItemsCount) {
            this.ui.totalItemsCount.innerText = this.list.length;
        }
    }

    parseColloData(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => {
            const content = line.replace(/^\d+\.\s*/, '');
            const parts = content.split(':');
            return {
                original: parts[0]?.trim() || content,
                meaning: parts[1]?.trim() || '',
                full: line,
                // Simple auto-tagging
                principle: content.includes('+') ? "[원칙 (2) 문법]" : "[원칙 (3) 콜로케이션]"
            };
        });
    }

    bindEvents() {
        // Start
        this.ui.btnStart.addEventListener('click', () => this.startGame(false));
        // Review Start
        if (this.ui.btnReview) {
            this.ui.btnReview.addEventListener('click', () => this.startGame(true));
        }

        // Restart
        this.ui.btnRestart.addEventListener('click', () => {
            // Reset everything including review button check
            this.checkReviewAvailability();
            this.switchView('start');
        });

        // Stop
        this.ui.btnStop.addEventListener('click', () => {
            if (confirm("정말 그만하시겠습니까? 현재까지의 결과로 성적표를 생성합니다.")) {
                this.endGame();
            }
        });

        // Answer Click
        this.ui.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value') || e.target.parentElement.getAttribute('data-value');
                this.handleAnswer(val);
            });
        });

        // Next Question
        this.ui.btnNext.addEventListener('click', () => this.forceNext());

        // Focus Tracking
        this.ui.container.addEventListener('click', () => {
            requestActiveGame(this);
        });

        // Data Modal Events (Collo only)
        // Data Modal Events (Existing Collo + New Vocab)
        if (this.ui.btnData) {
            this.ui.btnData.addEventListener('click', () => this.ui.modalData.classList.remove('hidden'));
            this.ui.btnCancelData.addEventListener('click', () => this.ui.modalData.classList.add('hidden'));
            this.ui.btnSaveData.addEventListener('click', () => {
                const txt = this.ui.inputData.value;
                let newItems = [];

                if (this.type === 'collo') {
                    newItems = this.parseColloData(txt);
                } else {
                    newItems = this.parseVocabData(txt);
                }

                if (newItems.length > 0) {
                    this.saveUserAddedData(newItems);
                    this.list = [...this.list, ...newItems];
                    this.updateTotalCountUI(); // Update Stats
                    alert(`${newItems.length} added!`);
                    this.ui.modalData.classList.add('hidden');
                    this.ui.inputData.value = "";
                } else {
                    alert("데이터 파싱 실패: 올바른 형식이 아닙니다.");
                }
            });
        }

        // View DB Events
        if (this.ui.btnViewDB) {
            this.ui.btnViewDB.addEventListener('click', () => this.openDatabase(1));
            this.ui.btnCloseDB.addEventListener('click', () => this.ui.modalDB.classList.add('hidden'));

            // Pagination Events
            if (this.ui.btnDBPrev) {
                this.ui.btnDBPrev.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.list.length / this.dbItemsPerPage) || 1;
                    if (this.dbCurrentPage > 1) this.openDatabase(this.dbCurrentPage - 1);
                });
            }
            if (this.ui.btnDBNext) {
                this.ui.btnDBNext.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.list.length / this.dbItemsPerPage) || 1;
                    if (this.dbCurrentPage < totalPages) this.openDatabase(this.dbCurrentPage + 1);
                });
            }
        }
    }

    parseVocabData(text) {
        // 1. Try JSON
        try {
            const json = JSON.parse(text);
            if (Array.isArray(json)) return json;
        } catch (e) { /* Not JSON */ }

        // 2. Text Parsing (Pattern: "1. Word (Meaning)")
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => {
            const match = line.match(/^(?:\d+\.\s*)?(.+?)\s*\((.+)\)$/);
            if (match) {
                const word = match[1].trim();
                const meaning = match[2].trim();
                return {
                    sentence: `What is the meaning of '${word}'?`,
                    word: word,
                    answer: "O",
                    explanation: `[원칙 (1) 문맥] ${meaning}`
                };
            }
            return null;
        }).filter(item => item !== null);
    }

    openDatabase(page = 1) {
        this.dbCurrentPage = page;
        this.ui.dbList.innerHTML = '';
        const items = [...this.list];

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / this.dbItemsPerPage) || 1;

        if (this.dbCurrentPage < 1) this.dbCurrentPage = 1;
        if (this.dbCurrentPage > totalPages) this.dbCurrentPage = totalPages;

        const start = (this.dbCurrentPage - 1) * this.dbItemsPerPage;
        const end = start + this.dbItemsPerPage;
        const pageItems = items.slice(start, end);

        if (totalItems === 0) {
            this.ui.dbList.innerHTML = '<li>데이터가 없습니다.</li>';
        } else {
            pageItems.forEach((item, index) => {
                const realIndex = start + index;
                const li = document.createElement('li');
                if (this.type === 'collo') {
                    li.innerHTML = `
                        <strong>${realIndex + 1}. ${item.original}</strong>
                        <div class="meta">
                            <span class="tag">${item.principle || 'General'}</span>
                            <span>Meaning: ${item.meaning}</span>
                        </div>
                    `;
                } else {
                    // Vocab
                    li.innerHTML = `
                        <strong>${realIndex + 1}. ${item.word}</strong>
                        <div class="meta">
                             <span class="tag">${item.answer || 'O'}</span>
                             <span>${item.sentence}</span>
                        </div>
                        <div class="explanation">
                            ${item.explanation}
                        </div>
                    `;
                }
                this.ui.dbList.appendChild(li);
            });
        }

        // Update Pagination Controls
        if (this.ui.dbPageInfo) {
            this.ui.dbPageInfo.innerText = `${this.dbCurrentPage} / ${totalPages}`;
            this.ui.btnDBPrev.disabled = (this.dbCurrentPage <= 1);
            this.ui.btnDBNext.disabled = (this.dbCurrentPage >= totalPages);
        }

        this.ui.modalDB.classList.remove('hidden');
    }

    startGame(isReview) {
        requestActiveGame(this);
        this.isReviewMode = isReview;

        // Reset State
        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0, wrongItems: [] };
        this.isWaiting = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;

        let pool = [];
        if (isReview) {
            pool = this.loadWrongAnswers();
            if (pool.length === 0) {
                alert("복습할 오답이 없습니다!");
                return;
            }
        } else {
            pool = this.list;
            if (pool.length === 0) {
                alert("데이터가 없습니다.");
                return;
            }
        }

        // Only generate up to maxQuestions or pool size
        this.questions = this.generateQuestions(Math.min(this.maxQuestions, pool.length), pool);

        this.switchView('quiz');
        this.updateProgress();
        this.showQuestion();
    }

    loadWrongAnswers() {
        const key = `personal-toeic_wrong_${this.type}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    saveWrongInfo(wrongItemsList) {
        if (!wrongItemsList || wrongItemsList.length === 0) return;
        const key = `personal-toeic_wrong_${this.type}`;
        const current = this.loadWrongAnswers();

        const map = new Map();
        // Handle both collo (original string) and vocab (word string) as key
        // We will use a composite key or just the 'original' / 'word' property
        current.forEach(item => map.set(item.word || item.original, item));
        wrongItemsList.forEach(item => map.set(item.word || item.original, item));

        const merged = Array.from(map.values());
        localStorage.setItem(key, JSON.stringify(merged));
        this.checkReviewAvailability();
    }

    checkReviewAvailability() {
        if (!this.ui.btnReview) return;
        const wrongs = this.loadWrongAnswers();
        if (wrongs.length > 0) {
            this.ui.btnReview.classList.remove('hidden');
            this.ui.btnReview.innerText = `틀린 문제 다시 보기 (${wrongs.length})`;
        } else {
            this.ui.btnReview.classList.add('hidden');
        }
    }

    generateQuestions(count, sourceList) {
        const result = [];
        let pool = [...sourceList].sort(() => Math.random() - 0.5);
        if (this.isReviewMode) {
            count = Math.min(count, pool.length);
        }

        const distractorPrepositions = ['to', 'on', 'with', 'for', 'of', 'in', 'at', 'by'];

        for (let i = 0; i < count; i++) {
            const item = pool[i % pool.length];
            // If item has explicit answer (Vocab X cases), respect it.
            // Otherwise random generate False (Collo)
            let isTrue = true;
            if (item.answer) {
                isTrue = (item.answer === 'O');
            } else {
                isTrue = Math.random() > 0.5;
            }

            let qText, explanation;

            if (this.type === 'collo') {
                const principle = item.principle || "[원칙 (3) 콜로케이션]";
                if (isTrue) {
                    qText = `"${item.original}" means "${item.meaning}".`;
                    if (item.original.includes('+')) {
                        qText = `Structure Check: Is "${item.original}" correct?`;
                    }
                    explanation = `${principle} ✅ Correct! "${item.original}" is the standard form.`;
                } else {
                    // False Generation Logic
                    if (item.original.includes('+')) {
                        const words = item.original.split(' ');
                        let swapped = false;
                        const newWords = words.map(w => {
                            if (distractorPrepositions.includes(w) && !swapped) {
                                const validDis = distractorPrepositions.filter(p => p !== w);
                                if (validDis.length > 0) {
                                    swapped = true;
                                    return validDis[Math.floor(Math.random() * validDis.length)];
                                }
                            }
                            return w;
                        });

                        if (swapped) {
                            qText = `Structure Check: Is "${newWords.join(' ')}" correct?`;
                        } else {
                            const other = pool[(i + 1) % pool.length];
                            qText = `Meaning Check: "${item.original}" means "${other.meaning}"?`;
                        }
                    } else {
                        const other = pool[(i + 1) % pool.length];
                        qText = `Meaning Check: "${item.original}" means "${other.meaning}"?`;
                    }
                    explanation = `${principle} ❌ False. Correct: "${item.original}" (${item.meaning}).`;
                }
            } else {
                // VOCAB logic
                // For Vocab, the item object already has 'sentence', 'word', 'explanation' (with principle included)
                // If the item is marked as Answer X in DB, we display it as such.
                // If it is Answer O, we display O.

                // NOTE: The 'isTrue' variable above was set based on item.answer.
                // Use the sentence and word from data.

                // If we want to dynamically generate False from True items, we can.
                // But the user provided "X" items specifically.
                // Let's assume the DB controls the correctness for Vocab mostly.
                // However, for variety, we can occasionally swap a True item to False if we run out of X items?
                // For now, let's strictly follow the DB 'answer' if present.

                qText = `Sent: "${item.sentence}"\nWord: [ ${item.word} ]\nIs this fitting?`;

                // Since explanation in JSON is the "Correct Explanation", we might need to prefix Outcome.
                const outcome = isTrue ? "✅ Yes!" : "❌ No.";
                explanation = `${outcome} ${item.explanation}`;
            }

            result.push({
                text: qText + "\n(O / X)",
                correctAnswer: isTrue ? 'O' : 'X',
                explanation: explanation,
                original: item
            });
        }
        return result;
    }

    showQuestion() {
        if (this.currentIndex >= this.questions.length) {
            this.endGame();
            return;
        }
        const q = this.questions[this.currentIndex];
        this.ui.questionText.innerText = q.text;

        this.isWaiting = false;
        this.ui.actionButtons.forEach(btn => btn.disabled = false);
        this.ui.modalFeedback.classList.add('hidden');

        this.updateProgress();
    }

    handleAnswer(userAns) {
        if (this.isWaiting) return;
        this.isWaiting = true;

        this.ui.actionButtons.forEach(btn => btn.disabled = true);

        const q = this.questions[this.currentIndex];
        const isCorrect = (userAns === q.correctAnswer);

        this.ui.feedbackTitle.innerText = isCorrect ? "Excellent!" : "Review Point";
        this.ui.feedbackIcon.innerText = isCorrect ? "🎉" : "🧐";
        this.ui.feedbackReason.innerText = q.explanation;
        this.ui.feedbackTitle.style.color = isCorrect ? 'var(--correct)' : 'var(--wrong)';

        if (isCorrect) {
            this.score.correct++;
        } else {
            this.score.wrong++;
            this.score.wrongItems.push(q.original);
        }

        this.ui.modalFeedback.classList.remove('hidden');

        this.timer = setTimeout(() => {
            this.forceNext();
        }, 1500);
    }

    forceNext() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.ui.modalFeedback.classList.add('hidden');
        this.currentIndex++;
        this.showQuestion();
    }

    triggerInput(input) {
        if (this.ui.viewQuiz.classList.contains('hidden')) return;

        if (input === 'NEXT') {
            if (this.isWaiting) {
                this.forceNext();
            }
        } else {
            if (!this.isWaiting) {
                this.handleAnswer(input);
            }
        }
    }

    endGame() {
        this.switchView('report');

        // Logic Check: 'currentIndex' is the number of questions ATTEMPTED/FINISHED if called from showQuestion overflow
        // If called from Early Exit, currentIndex is the one we were staring at (not finished).
        // BUT score.correct + score.wrong equals the number of questions actually answered.

        const totalAnswered = this.score.correct + this.score.wrong;
        const pct = totalAnswered === 0 ? 0 : Math.round((this.score.correct / totalAnswered) * 100);

        this.ui.scoreText.innerText = `${pct}%`;

        // Circular Chart Animation (Dashoffset)
        const radius = 15.9155;
        const circumference = 2 * Math.PI * radius; // ~100
        const offset = 100 - pct; // 100 means empty, 0 means full

        // Force reflow for animation restart if needed, or just set it
        this.ui.circlePath.style.transition = 'none';
        this.ui.circlePath.setAttribute('stroke-dasharray', `100 100`);
        this.ui.circlePath.setAttribute('stroke-dashoffset', '100'); // start empty

        setTimeout(() => {
            this.ui.circlePath.style.transition = 'stroke-dashoffset 1s ease-out';
            this.ui.circlePath.setAttribute('stroke-dashoffset', offset.toString());
        }, 50);


        this.ui.correctCount.innerText = `${this.score.correct}`;
        this.ui.wrongCount.innerText = `${this.score.wrong}`;

        this.ui.wrongList.innerHTML = '';
        if (this.score.wrongItems.length > 0) {
            this.ui.wrongSection.classList.remove('hidden');
            this.score.wrongItems.forEach(item => {
                const li = document.createElement('li');
                // Handle polymorphism: Collo has 'original/meaning', Vocab has 'word/explanation'
                const mainText = item.original || item.sentence;
                let subText = item.meaning ? item.meaning : `${item.word} (${item.answer || 'O'}) - ${item.explanation}`;

                // For Vocab, maybe just show Word + Explanation
                if (this.type === 'vocab') {
                    li.innerHTML = `<strong>${item.word}</strong>: ${item.explanation} <br><small>${item.sentence}</small>`;
                } else {
                    li.innerHTML = `<strong>${item.original}</strong> : ${item.meaning}`;
                }

                this.ui.wrongList.appendChild(li);
            });

            this.saveWrongInfo(this.score.wrongItems);

        } else {
            this.ui.wrongSection.classList.add('hidden');
        }
    }

    updateProgress() {
        const txt = `${this.currentIndex + 1} / ${this.questions.length}`;
        this.ui.progressText.innerText = txt;
        const percent = ((this.currentIndex) / this.questions.length) * 100;
        this.ui.progressFill.style.width = `${percent}%`;
    }

    switchView(name) {
        const views = [this.ui.viewStart, this.ui.viewQuiz, this.ui.viewReport];
        views.forEach(v => v.classList.remove('active', 'hidden'));
        views.forEach(v => v.classList.add('hidden'));

        if (name === 'start') this.ui.viewStart.classList.remove('hidden');
        if (name === 'quiz') this.ui.viewQuiz.classList.remove('hidden');
        if (name === 'report') this.ui.viewReport.classList.remove('hidden');

        if (name === 'start') this.ui.viewStart.classList.add('active');
        if (name === 'quiz') this.ui.viewQuiz.classList.add('active');
        if (name === 'report') this.ui.viewReport.classList.add('active');

        if (name === 'quiz') this.ui.progressContainer.classList.remove('hidden');
        else this.ui.progressContainer.classList.add('hidden');
    }
}

// 4. Global Managers
let activeGame = null;

function requestActiveGame(game) {
    if (activeGame === game) return;
    if (activeGame) {
        activeGame.ui.container.classList.remove('focused');
    }
    activeGame = game;
    activeGame.ui.container.classList.add('focused');
}

document.addEventListener('keydown', (e) => {
    if (!activeGame) return;

    // Fix Bug 1: Prevent shortcuts when typing in Input/Textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toUpperCase();

    if (key === 'O') {
        activeGame.triggerInput('O');
    } else if (key === 'X') {
        activeGame.triggerInput('X');
    } else if (key === 'ENTER' || key === ' ') {
        e.preventDefault();
        activeGame.triggerInput('NEXT');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Instance 1: Collocation Quiz
    const colloQuiz = new QuizGame('collo-', 'collo', INITIAL_DATA_RAW);

    // Instance 2: Vocab Quiz
    const vocabQuiz = new QuizGame('vocab-', 'vocab', VOCAB_QUIZ_DATA);

    // Default focus to left
    requestActiveGame(colloQuiz);
});


