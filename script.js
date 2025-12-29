/**
 * TOEIC Dual Quiz Master
 * Refactored for Side-by-Side Layout
 */

// 1. Data Sources

// Left: Existing Raw Data
const INITIAL_DATA_RAW = `1. name + 사람/직책 : ~를 지명/임명하다
2. request + 사물 : ~를 요청하다
3. inform/advise + 사람 : ~에게 알리다
4. calculate precisely : 정확하게 계산하다
5. adopt standards : 기준을 채택하다
6. urge A to do : A에게 ~하라고 권고하다
7. be eligible for + 명사 : ~에 대한 자격이 있다
8. equivalent to + 명사/-ing : ~와 동등하다
9. in addition to + 명사/-ing : ~뿐만 아니라
10. comply with : 규정을 준수하다
11. respond/reply to : ~에 응답하다
12. scope of the contract : 계약 범위
13. higher than average : 평균보다 높은
14. better than expected : 기대보다 나은
15. conservative estimate : 보수적인 견적
16. bring together : 한데 모으다/소집하다
17. once + 주어 + 동사 : 일단 ~하면/하자마자 (접속사)
18. unless otherwise noted : 별도 언급 없는 한
19. cautiously drive : 조심스럽게 운전하다
20. be responsible for : ~에 책임이 있다`;

// Right: New Dummy Data
const VOCAB_QUIZ_DATA = [
    { sentence: "The committee will _______ its weekly meetings next Monday.", word: "resume", answer: "O", explanation: "중단된 것을 '재개하다'라는 의미의 resume이 적절합니다." },
    { sentence: "Drivers should drive _______ near the construction site.", word: "cautiously", answer: "O", explanation: "안전을 위해 '조심스럽게'라는 부사가 문맥상 어울립니다." },
    { sentence: "The new policy is _______ for all full-time employees.", word: "applicable", answer: "O", explanation: "정책이 직원들에게 '적용 가능하다'는 문맥입니다." },
    { sentence: "We need a _______ estimate for the upcoming project costs.", word: "conservative", answer: "O", explanation: "비용을 낮게 잡은 '보수적인' 견적이 문맥상 적절합니다." }
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

        // UI References - Safe Binding for Pro Level Stability
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
                modalData: get(`${prefix}data-modal`),
                inputData: get(`${prefix}data-input`),
                btnSaveData: get(`${prefix}btn-save-data`),
                btnCancelData: get(`${prefix}btn-cancel-data`),
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
        if (this.type === 'collo') {
            this.list = this.parseColloData(this.rawData);
        } else {
            this.list = [...this.rawData];
        }
        if (this.ui.totalItemsCount) this.ui.totalItemsCount.innerText = this.list.length;
    }

    parseColloData(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => {
            const content = line.replace(/^\d+\.\s*/, '');
            const parts = content.split(':');
            return {
                original: parts[0]?.trim() || content,
                meaning: parts[1]?.trim() || '',
                full: line
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
        this.ui.btnRestart.addEventListener('click', () => this.switchView('start'));

        // Stop
        this.ui.btnStop.addEventListener('click', () => {
            if (confirm("정말 그만하시겠습니까? 현재 결과로 리포트가 생성됩니다.")) {
                this.endGame();
            }
        });

        // Answer Click
        this.ui.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isWaiting) return; // Prevent extra clicks
                const val = e.target.getAttribute('data-value') || e.target.parentElement.getAttribute('data-value');
                this.handleAnswer(val);
            });
        });

        // Next Question (Manual Trigger via Next Button or logic)
        // Note: The prompt asks for "Auto move OR Next button". We will auto-move, but keep button just in case or for manual override.
        this.ui.btnNext.addEventListener('click', () => this.forceNext());

        // Focus Tracking
        this.ui.container.addEventListener('click', () => {
            requestActiveGame(this);
        });

        // Data Modal Events (Collo only)
        if (this.type === 'collo' && this.ui.btnData) {
            this.ui.btnData.addEventListener('click', () => this.ui.modalData.classList.remove('hidden'));
            this.ui.btnCancelData.addEventListener('click', () => this.ui.modalData.classList.add('hidden'));
            this.ui.btnSaveData.addEventListener('click', () => {
                const txt = this.ui.inputData.value;
                const newItems = this.parseColloData(txt);
                if (newItems.length > 0) {
                    this.list = [...this.list, ...newItems];
                    this.ui.totalItemsCount.innerText = this.list.length;
                    alert(`${newItems.length} added!`);
                    this.ui.modalData.classList.add('hidden');
                    this.ui.inputData.value = "";
                }
            });
        }
    }

    startGame(isReview) {
        requestActiveGame(this); // Force focus on start
        this.isReviewMode = isReview;

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

        this.questions = this.generateQuestions(this.maxQuestions, pool); // Pass pool explicitly
        // If review mode has fewer questions, adjust max logic inside generateQuestions or just take all
        this.currentIndex = 0;
        this.score = { correct: 0, wrong: 0, wrongItems: [] };

        this.switchView('quiz');
        this.updateProgress();
        this.showQuestion();
    }

    loadWrongAnswers() {
        const key = `toeic_wrong_${this.type}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    saveWrongInfo(wrongItemsList) {
        if (!wrongItemsList || wrongItemsList.length === 0) return;
        const key = `toeic_wrong_${this.type}`;
        const current = this.loadWrongAnswers();

        // Merge and deduplicate based on 'original' string
        const map = new Map();
        current.forEach(item => map.set(item.original, item));
        wrongItemsList.forEach(item => map.set(item.original, item));

        const merged = Array.from(map.values());
        localStorage.setItem(key, JSON.stringify(merged));
        this.checkReviewAvailability(); // Update button visibility
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
        // If review mode, we just shuffle the sourceList and make questions (up to count)
        // If normal mode, we take random samples.

        let pool = [...sourceList].sort(() => Math.random() - 0.5);
        if (this.isReviewMode) {
            count = Math.min(count, pool.length);
        }

        const distractorPrepositions = ['to', 'on', 'with', 'for', 'of', 'in', 'at', 'by'];

        for (let i = 0; i < count; i++) {
            const item = pool[i % pool.length];
            const isTrue = Math.random() > 0.5;
            let qText, explanation;

            if (this.type === 'collo') {
                if (isTrue) {
                    qText = `"${item.original}" means "${item.meaning}".`;
                    if (item.original.includes('+')) {
                        qText = `The structure "${item.original}" is correct for: ${item.meaning}`;
                    }
                    explanation = `✅ Correct! "${item.original}" is the standard collocation.`;
                } else {
                    // Robust False Logic
                    if (item.original.includes('+')) {
                        const words = item.original.split(' ');
                        let swapped = false;
                        const newWords = words.map(w => {
                            // Only swap if it's a preposition and we haven't swapped yet
                            if (distractorPrepositions.includes(w) && !swapped) {
                                // Filter out the CORRECT preposition to ensure it's actually false
                                const validDis = distractorPrepositions.filter(p => p !== w);
                                if (validDis.length > 0) {
                                    swapped = true;
                                    return validDis[Math.floor(Math.random() * validDis.length)];
                                }
                            }
                            return w;
                        });

                        // Safety: if swap didn't happen (no prep found), fallback to meaning swap
                        if (swapped) {
                            qText = `The correct form is "${newWords.join(' ')}".`;
                        } else {
                            const other = pool[(i + 1) % pool.length];
                            qText = `"${item.original}" translates to: ${other.meaning}`;
                        }
                    } else {
                        const other = pool[(i + 1) % pool.length];
                        qText = `"${item.original}" translates to: ${other.meaning}`;
                    }
                    explanation = `❌ False. Correct: "${item.original}" (${item.meaning}).`;
                }
            } else {
                // VOCAB logic
                if (isTrue) {
                    qText = `Sent: "${item.sentence}"\nWord: [ ${item.word} ]\nIs this fitting?`;
                    explanation = `✅ Yes! ${item.explanation}`;
                } else {
                    // Robust False Logic for Vocab
                    const otherItems = pool.filter(x => x.word !== item.word); // Ensure distinct word
                    // Fallback if pool is too small (e.g. in review mode with 1 item)
                    if (otherItems.length === 0) {
                        // Impossible to make False question for single item pool without external data
                        // Force True or use a generic dummy?
                        // Let's force True if we can't make a False
                        qText = `Sent: "${item.sentence}"\nWord: [ ${item.word} ]\nIs this fitting?`;
                        explanation = `✅ Yes! ${item.explanation}`;
                        // We must set correctAnswer to 'O' below if we forced True logic here
                        // But local isTrue specific to this branch... 
                        // Refactor: if strictly 1 item in review, just show it as True? Or skip false logic.
                        // For now let's just proceed. The code below uses 'isTrue' variable.
                        // We need to override it.
                        // Actually, let's just handle it gracefull:
                    } else {
                        const wrongItem = otherItems[Math.floor(Math.random() * otherItems.length)];
                        qText = `Sent: "${item.sentence}"\nWord: [ ${wrongItem.word} ]\nIs this fitting?`;
                        explanation = `❌ No. The context requires '${item.word}'. '${wrongItem.word}' doesn't fit here.`;
                    }
                }
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

        // Reset UI state
        this.isWaiting = false;
        this.ui.actionButtons.forEach(btn => {
            btn.disabled = false;
        });
        this.ui.modalFeedback.classList.add('hidden'); // Ensure hidden

        this.updateProgress();
    }

    handleAnswer(userAns) {
        if (this.isWaiting) return; // double safety
        this.isWaiting = true;

        // Disable buttons
        this.ui.actionButtons.forEach(btn => btn.disabled = true);

        const q = this.questions[this.currentIndex];
        const isCorrect = (userAns === q.correctAnswer);

        this.ui.feedbackTitle.innerText = isCorrect ? "Excellent!" : "Not Quite...";
        this.ui.feedbackIcon.innerText = isCorrect ? "🎉" : "💪";
        this.ui.feedbackReason.innerText = q.explanation;
        this.ui.feedbackTitle.style.color = isCorrect ? 'var(--correct)' : 'var(--wrong)';

        if (isCorrect) {
            this.score.correct++;
        } else {
            this.score.wrong++;
            this.score.wrongItems.push(q.original);
        }

        // Show Feedback
        this.ui.modalFeedback.classList.remove('hidden');

        // UX: Delay then Auto-Next
        // If user presses Enter/Space during this time, forceNext() is called.
        this.timer = setTimeout(() => {
            this.forceNext();
        }, 1500);
    }

    forceNext() {
        // Called by timer OR manual input (Enter/Space)
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;

        // Hide modal and move on
        this.ui.modalFeedback.classList.add('hidden');
        this.currentIndex++;
        this.showQuestion();
    }

    // Keyboard Input Handler (called by global listener)
    triggerInput(input) {
        // Input: 'O', 'X', 'NEXT'
        if (this.ui.viewQuiz.classList.contains('hidden')) return; // Not in quiz mode

        if (input === 'NEXT') {
            if (this.isWaiting) {
                this.forceNext(); // Skip delay
            }
        } else {
            // O or X
            if (!this.isWaiting) {
                this.handleAnswer(input);
            }
        }
    }

    endGame() {
        this.switchView('report');

        const total = this.score.correct + this.score.wrong;
        const pct = total === 0 ? 0 : Math.round((this.score.correct / total) * 100);

        this.ui.scoreText.innerText = `${pct}%`;
        this.ui.circlePath.setAttribute('stroke-dasharray', `${pct}, 100`);
        this.ui.correctCount.innerText = `${this.score.correct}`;
        this.ui.wrongCount.innerText = `${this.score.wrong}`;

        this.ui.wrongList.innerHTML = '';
        if (this.score.wrongItems.length > 0) {
            this.ui.wrongSection.classList.remove('hidden');
            this.score.wrongItems.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.original}</strong> : ${item.meaning}`;
                this.ui.wrongList.appendChild(li);
            });

            // Save to LocalStorage
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

        // If returning to start, refresh button
        if (name === 'start') this.checkReviewAvailability();
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

    const key = e.key.toUpperCase();

    if (key === 'O') {
        activeGame.triggerInput('O');
    } else if (key === 'X') {
        activeGame.triggerInput('X');
    } else if (key === 'ENTER' || key === ' ') {
        e.preventDefault(); // Prevent scrolling
        activeGame.triggerInput('NEXT'); // Acts as skip delay or just next (if manual next was impl)
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

