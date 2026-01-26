/**
 * TOEIC Dual Quiz Master
 * Refactored: Left (LC Memo) / Right (Vocab Quiz)
 */

// 1. Data Sources

// Left: LC Misheard Memo Data
// Format: Actual | Misheard | Note
const INITIAL_DATA_RAW = [
    "All rights reserved | All rights this from | '모든 권리 보유'라는 뜻인데, 소리가 뭉쳐서 'All rights this from'으로 오청함.",
    "In this Video | and this video / at this video | 소리에는 뭉게져서 들리는게 원인이고, 뭉게져서 들어도 이정도는 항상 뭉게져서 들어도 문맥적 예측을 해서 바로 바꿔듣자.",
    "Yeah but Thanks, me,too. | I'm thank, Micheal. | 머릿속에서 못 듣고 지나가면 알아서 정보가 채워지는것을 주의, 미리 문장을 외워두기. Yeah, but Thanks, Me too",
    "And I watch your show. I watch Impractical Jokers all the time. | I'm what you syre? What you block on Jake on 블라블라. | 아예 듣기 힘든거는 들리지도 안됨. 계속 듣고 문장을 외워야 해",
    "That's exactly we were saying | That's exa we were saying | 그냥 빠름",
    "And we didn't get just one member, but all four of the pop rock global phenomenon, Five seconds of Summer. | It's just one meal, but four 블라블라 | 그냥 안들리는거임 반복 듣기 부탁"
];

// Right: Vocab Context Quiz Data
const VOCAB_QUIZ_DATA = [
    { sentence: "I want to _______ my English.", word: "improve", answer: "O", explanation: "문맥상 적절합니다." },
    { sentence: "Million = 10^6, Billion = 10^9, Trillion = 10^12", word: "Number Units", answer: "O", explanation: "Million(10의 6승), Billion(10의 9승), Trillion(10의 12승)이 맞습니다." },
    { sentence: "I'm tryna get there on time.", word: "tryna", answer: "O", explanation: "trying to(하려고 애쓰고 있다)의 줄임말입니다." },
    { sentence: "It's done.", word: "Done", answer: "O", explanation: "Done은 do의 p.p형태 맞지만, 형용사로 쓰여 '해온', '끝났다'라는 뜻입니다." },
    { sentence: "He got nailed by the ball.", word: "get nailed by", answer: "O", explanation: "'정타로 맞다', '세게 두들겨 맞다'라는 뜻입니다." },
    { sentence: "He gave a snort.", word: "snort", answer: "O", explanation: "콧김을 내뿜다, 쭉 들이키다" },
    { sentence: "The fact that that's his response is crazy.", word: "Expression", answer: "O", explanation: "'방금 대답 충격적이었어'라는 뜻입니다." }
];

/**
 * QuizGame Class
 * Encapsulates logic for a single quiz instance.
 */
class QuizGame {
    constructor(prefix, type, data) {
        this.prefix = prefix; // 'collo-' or 'vocab-'
        this.type = type;     // 'collo' (Left) or 'vocab' (Right)
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

                // Quiz View Elements
                questionText: get(`${prefix}question-text`), // Only for Vocab
                contentArea: get(`${prefix}content-area`),   // Only for Collo (LC Memo)

                totalItemsCount: get(`${prefix}total-items-count`),

                // Feedback Modal
                modalFeedback: get(`${prefix}feedback-modal`),
                feedbackIcon: get(`${prefix}feedback-icon`),
                feedbackTitle: get(`${prefix}feedback-title`),
                feedbackReason: get(`${prefix}feedback-reason`),
                btnNext: get(`${prefix}btn-next`),

                // Report Elements
                scoreSection: get(`${prefix}score-section`), // To hide for Collo
                circlePath: get(`${prefix}score-circle-path`),
                scoreText: get(`${prefix}score-text`),
                correctCount: get(`${prefix}correct-count`),
                wrongCount: get(`${prefix}wrong-count`),
                wrongSection: get(`${prefix}wrong-answers-section`),
                wrongList: get(`${prefix}wrong-items-list`),

                // Buttons
                btnStart: get(`${prefix}btn-start`),
                btnReview: get(`${prefix}btn-review`),
                btnRestart: get(`${prefix}btn-restart`),
                btnStop: get(`${prefix}btn-stop`),

                // Quiz Actions
                actionButtons: document.querySelectorAll(`#${prefix}quiz-view .btn-ox`), // O/X Buttons
                btnNextStep: get(`${prefix}btn-next-step`), // 'Next' button for Collo

                // Data Modal
                btnData: get(`${prefix}btn-data`),
                btnViewDB: get(`${prefix}btn-view-db`),

                modalData: get(`${prefix}data-modal`),
                inputData: get(`${prefix}data-input`),
                btnSaveData: get(`${prefix}btn-save-data`),
                btnCancelData: get(`${prefix}btn-cancel-data`),

                modalDB: get(`${prefix}db-modal`),
                dbList: get(`${prefix}db-list`),
                btnCloseDB: get(`${prefix}btn-close-db`),

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
            // LC Memo Parsing
            if (Array.isArray(this.rawData)) {
                // If already array of strings, parse them
                baseData = this.parseColloData(this.rawData.join('\n'));
            } else {
                baseData = this.parseColloData(this.rawData);
            }
        } else {
            // Vocab (JSON Objects)
            baseData = [...this.rawData];
        }

        const userData = this.loadUserAddedData();
        this.list = [...baseData, ...userData];

        if (this.ui.totalItemsCount) this.ui.totalItemsCount.innerText = this.list.length;
    }

    loadUserAddedData() {
        const key = `personal_toeic_user_data_${this.type}`;
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
        // Format: Actual | Misheard | Note
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => {
            if (line.trim().startsWith('//')) return null; // comment support
            const parts = line.split('|');
            if (parts.length < 2) return null; // basic validation

            return {
                actual: parts[0].trim(),
                misheard: parts[1].trim(),
                note: parts[2] ? parts[2].trim() : '',
                full: line
            };
        }).filter(item => item !== null);
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

    bindEvents() {
        // Start
        this.ui.btnStart.addEventListener('click', () => this.startGame(false));

        // Review Start
        if (this.ui.btnReview) {
            this.ui.btnReview.addEventListener('click', () => this.startGame(true));
        }

        // Restart
        this.ui.btnRestart.addEventListener('click', () => {
            this.checkReviewAvailability();
            this.switchView('start');
        });

        // Stop
        this.ui.btnStop.addEventListener('click', () => {
            if (confirm("정말 그만하시겠습니까? 현재까지의 결과를 확인합니다.")) {
                this.endGame();
            }
        });

        // Answer Click (Vocab Only)
        this.ui.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value') || e.target.parentElement.getAttribute('data-value');
                this.handleAnswer(val);
            });
        });

        // Next Button (Collo Only)
        if (this.ui.btnNextStep) {
            this.ui.btnNextStep.addEventListener('click', () => {
                this.forceNext();
            });
        }

        // Feedback Next (Vocab Only)
        if (this.ui.btnNext) {
            this.ui.btnNext.addEventListener('click', () => this.forceNext());
        }

        // Focus Tracking
        this.ui.container.addEventListener('click', () => {
            requestActiveGame(this);
        });

        // Data Modal
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
                    this.updateTotalCountUI();
                    alert(`${newItems.length} added!`);
                    this.ui.modalData.classList.add('hidden');
                    this.ui.inputData.value = "";
                } else {
                    alert("데이터 파싱 실패: 형식을 확인해주세요.");
                }
            });
        }

        // DB View
        if (this.ui.btnViewDB) {
            this.ui.btnViewDB.addEventListener('click', () => this.openDatabase(1));
            this.ui.btnCloseDB.addEventListener('click', () => this.ui.modalDB.classList.add('hidden'));

            if (this.ui.btnDBPrev) {
                this.ui.btnDBPrev.addEventListener('click', () => {
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

    openDatabase(page = 1) {
        this.dbCurrentPage = page;
        this.ui.dbList.innerHTML = '';
        const items = [...this.list];

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / this.dbItemsPerPage) || 1;

        if (this.dbCurrentPage < 1) this.dbCurrentPage = 1;
        if (this.dbCurrentPage > totalPages && totalPages > 0) this.dbCurrentPage = totalPages;

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
                    // LC Memo DB View
                    li.innerHTML = `
                        <div class="db-item-header"><strong>#${realIndex + 1}</strong></div>
                        <div style="color:#4ade80;">Actual: ${item.actual}</div>
                        <div style="color:#f87171;">Misheard: ${item.misheard}</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Note: ${item.note}</div>
                    `;
                } else {
                    // Vocab Query DB View
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
        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0, wrongItems: [] };
        this.isWaiting = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;

        let pool = [];
        if (isReview) {
            pool = this.loadWrongAnswers();
            if (pool.length === 0) {
                alert("복습할 항목이 없습니다.");
                return;
            }
        } else {
            pool = this.list;
            if (pool.length === 0) {
                alert("데이터가 없습니다. 데이터를 추가해주세요!");
                return;
            }
        }

        // For Collo, we just iterate through the list (shuffled or not). 
        // Let's shuffle for variety, or keep order? User said "Memo Pad", usually implies order isn't critical but random is good for practice.
        // Let's shuffle.
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

    checkReviewAvailability() {
        if (!this.ui.btnReview) return;
        // Collo area doesn't really have "Wrong" answers anymore, so maybe hide review button?
        // But if user wants to keep it for old data or if we implement "Mark as Hard", we could use it.
        // For now, if Collo, we might optimize out.
        if (this.type === 'collo') {
            this.ui.btnReview.classList.add('hidden');
            return;
        }

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

        for (let i = 0; i < count; i++) {
            const item = pool[i];

            if (this.type === 'collo') {
                // LC Memo: Just the item.
                result.push({
                    type: 'memo',
                    original: item
                });
            } else {
                // Vocab: O/X Quiz
                let isTrue = (item.answer === 'O');
                // Could act random, but sticking to data
                const qText = `Sent: "${item.sentence}"\nWord: [ ${item.word} ]\nIs this fitting?`;
                const outcome = isTrue ? "✅ Yes!" : "❌ No.";
                const explanation = `${outcome} ${item.explanation}`;

                result.push({
                    type: 'quiz',
                    text: qText + "\n(O / X)",
                    correctAnswer: isTrue ? 'O' : 'X',
                    explanation: explanation,
                    original: item
                });
            }
        }
        return result;
    }

    showQuestion() {
        if (this.currentIndex >= this.questions.length) {
            this.endGame();
            return;
        }
        const q = this.questions[this.currentIndex];

        if (this.type === 'collo') {
            // Render Memo
            if (this.ui.contentArea) {
                this.ui.contentArea.innerHTML = `
                    <div class="memo-field">
                        <span class="label">Actual Sound</span>
                        <div class="value actual">${q.original.actual}</div>
                    </div>
                    <div class="memo-field">
                        <span class="label">Misheard As</span>
                        <div class="value misheard">${q.original.misheard}</div>
                    </div>
                    <div class="memo-field note">
                        <span class="label">Note</span>
                        <div class="value">${q.original.note}</div>
                    </div>
                `;
            }
            // Show Next Button, Hide O/X (controlled in CSS/HTML structure mainly, but let's ensure)
            // Note: In new HTML, O/X buttons are replaced by Next button for Collo.
        } else {
            // Render Vocab Quiz
            if (this.ui.questionText) {
                this.ui.questionText.innerText = q.text;
            }
            this.ui.actionButtons.forEach(btn => btn.disabled = false);
            this.ui.modalFeedback.classList.add('hidden');
        }

        this.updateProgress();
    }

    handleAnswer(userAns) {
        if (this.type === 'collo') {
            // Collo has no "answer", just Next.
            this.forceNext();
            return;
        }

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

        // Auto advance after short delay
        this.timer = setTimeout(() => {
            this.forceNext();
        }, 1500);
    }

    forceNext() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        if (this.ui.modalFeedback) this.ui.modalFeedback.classList.add('hidden');
        this.currentIndex++;
        this.showQuestion();
    }

    triggerInput(input) {
        if (this.ui.viewQuiz.classList.contains('hidden')) return;

        if (input === 'NEXT') {
            if (this.type === 'collo') {
                this.forceNext();
            } else {
                if (this.isWaiting) {
                    this.forceNext();
                }
            }
        } else {
            // O/X Inputs
            if (this.type === 'vocab' && !this.isWaiting) {
                this.handleAnswer(input);
            }
        }
    }

    endGame() {
        this.switchView('report');

        if (this.type === 'collo') {
            // LC Memo Report: No score
            if (this.ui.scoreSection) this.ui.scoreSection.classList.add('hidden');
            // Maybe show a list of what we recalled? Or just 'Done'.
            // For now, generic done message is fine.
        } else {
            // Vocab Report: Show Score
            if (this.ui.scoreSection) this.ui.scoreSection.classList.remove('hidden');

            const totalAnswered = this.score.correct + this.score.wrong;
            const pct = totalAnswered === 0 ? 0 : Math.round((this.score.correct / totalAnswered) * 100);

            this.ui.scoreText.innerText = `${pct}%`;

            const radius = 15.9155;
            const offset = 100 - pct;

            this.ui.circlePath.style.transition = 'none';
            this.ui.circlePath.setAttribute('stroke-dashoffset', '100');

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
                    li.innerHTML = `<strong>${item.word}</strong>: ${item.explanation} <br><small>${item.sentence}</small>`;
                    this.ui.wrongList.appendChild(li);
                });
                // Save wrongs logic if needed (borrowed from previous implementation)
                const key = `personal-toeic_wrong_${this.type}`;
                // Simplified overwrite for now
                localStorage.setItem(key, JSON.stringify(this.score.wrongItems));

            } else {
                this.ui.wrongSection.classList.add('hidden');
            }
        }
    }

    updateProgress() {
        const txt = `${this.currentIndex + 1} / ${this.questions.length}`;
        const percent = ((this.currentIndex) / this.questions.length) * 100;

        this.ui.progressText.innerText = txt;
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
    // Instance 1: LC Misheard Memo (Left)
    const colloQuiz = new QuizGame('collo-', 'collo', INITIAL_DATA_RAW);

    // Instance 2: Vocab Quiz (Right)
    const vocabQuiz = new QuizGame('vocab-', 'vocab', VOCAB_QUIZ_DATA);

    // Default focus to left
    requestActiveGame(colloQuiz);
});
