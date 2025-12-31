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
    { sentence: "The recruitment process was deemed _______ and transparent by all candidates.", word: "fair", answer: "O", explanation: "[원칙 (1) 문맥] 투명하고 '공정한' 채용 과정이라는 의미가 자연스럽습니다." },
    { sentence: "Please _______ your previous work experiences in the application form.", word: "list", answer: "O", explanation: "[원칙 (2) 문법] 타동사 자리로 '목록에 기입하다'라는 의미의 동사 list가 적절합니다." },
    { sentence: "The candidate has a natural _______ for computer programming.", word: "aptitude", answer: "O", explanation: "[원칙 (1) 문맥] 프로그래밍에 대한 타고난 '적성/재능'을 뜻하므로 적절합니다." },
    { sentence: "All visitors are _______ to show their ID at the entrance.", word: "be admitted to", answer: "X", explanation: "[원칙 (3) 콜로케이션] 입장하다는 'be admitted to'이나, 이 문장은 '권고받다'인 'be advised to'가 문맥상 더 정확하거나 구조가 다릅니다." },
    { sentence: "The selection _______ for the new manager are very strict.", word: "criteria", answer: "O", explanation: "[원칙 (1) 문맥] 선택 '기준'이라는 의미의 복수 명사로 적절합니다." },
    { sentence: "The evidence provided was _______ to support the claim.", word: "insufficient", answer: "O", explanation: "[원칙 (1) 문맥] 주장을 뒷받침하기에 '불충분한'이라는 뜻이 논리적입니다." },
    { sentence: "He has _______ experience in the field of international trade.", word: "particular", answer: "O", explanation: "[원칙 (1) 문맥] 국제 무역 분야의 '특정한/실무적' 경험을 의미합니다." },
    { sentence: "A strong _______ from your former employer is required.", word: "reference letter", answer: "O", explanation: "[원칙 (1) 문맥] 고용주가 써주는 '추천서'를 의미하므로 적절합니다." },
    { sentence: "The company aims to _______ in customer service satisfaction.", word: "excel", answer: "O", explanation: "[원칙 (1) 문맥] 서비스 만족도 면에서 '능가하다/뛰어나다'는 의미로 적절합니다." },
    { sentence: "She is a highly _______ applicant with multiple certifications.", word: "talented", answer: "O", explanation: "[원칙 (1) 문맥] 자격증이 많은 '유능한' 지원자라는 의미가 자연스럽습니다." },
    { sentence: "The total _______ has increased by 10% this year.", word: "workforce", answer: "O", explanation: "[원칙 (1) 문맥] 회사의 '직원 수/노동인구'가 증가했다는 의미입니다." },
    { sentence: "He showed great _______ by finishing the marathon despite the pain.", word: "endurance", answer: "O", explanation: "[원칙 (1) 문맥] 고통에도 불구하고 완주한 '인내력'을 뜻합니다." },
    { sentence: "The applicant is _______ and can speak both English and Spanish.", word: "bilingual", answer: "O", explanation: "[원칙 (1) 문맥] 2개 국어를 구사한다는 내용과 일치합니다." },
    { sentence: "Employees are encouraged to _______ to the company's goals.", word: "make a commitment to", answer: "O", explanation: "[원칙 (3) 콜로케이션] ~에 헌신/전념하다는 뜻의 숙어 표현입니다." },
    { sentence: "The manager _______ always arriving early for meetings.", word: "makes a point of", answer: "O", explanation: "[원칙 (3) 콜로케이션] '반드시 ~하다'라는 관용 구문입니다." },
    { sentence: "Even a _______ can learn the basics within a week.", word: "novice", answer: "O", explanation: "[원칙 (1) 문맥] '초보자/무경험자'도 배울 수 있다는 흐름이 자연스럽습니다." },
    { sentence: "He gained _______ experience by working on the factory floor.", word: "firsthand", answer: "O", explanation: "[원칙 (1) 문맥] 직접 몸으로 부딪쳐 얻은 '직접적인' 경험을 뜻합니다." },
    { sentence: "The initial _______ process will take about two weeks.", word: "screening", answer: "O", explanation: "[원칙 (1) 문맥] 지원자를 걸러내는 '심사/선발' 과정을 의미합니다." },
    { sentence: "We need to _______ the office supplies before the week ends.", word: "replenish", answer: "O", explanation: "[원칙 (1) 문맥] 부족한 비품을 '다시 채우다/보충하다'는 의미입니다." },
    { sentence: "Your salary will be _______ with your level of experience.", word: "commensurate", answer: "O", explanation: "[원칙 (3) 콜로케이션] ~에 '비례하는/상응하는'의 의미로 전치사 with와 자주 쓰입니다." },
    { sentence: "Passing the exam is a _______ for graduation.", word: "prerequisite", answer: "O", explanation: "[원칙 (1) 문맥] 졸업을 위한 '필수 전제 조건'을 의미합니다." },
    // Additional items to reach 44
    { sentence: "We are hiring for a _______ position in the sales department.", word: "part time", answer: "O", explanation: "[원칙 (1) 문맥] 정규직이 아닌 '시간제/파트타임' 직책을 의미합니다." },
    { sentence: "Her positive _______ influences the whole team.", word: "attitude", answer: "O", explanation: "[원칙 (1) 문맥] 팀에 영향을 주는 긍정적인 '태도'가 문맥상 적절합니다. (Aptitude는 적성)" },
    { sentence: "I will attend the year-end _______ with my colleagues.", word: "party", answer: "O", explanation: "[원칙 (1) 문맥] 동료들과 참석하는 연말 '파티/모임'이 자연스럽습니다." },
    { sentence: "Applicants may _______ if they were rejected previously.", word: "reapply", answer: "O", explanation: "[원칙 (1) 문맥] 이전에 거절당했다면 '재지원' 할 수 있다는 내용입니다." },
    { sentence: "All new hires must attend the orientation at the _______.", word: "training center", answer: "O", explanation: "[원칙 (1) 문맥] 신입 사원들이 교육받는 '연수원/훈련 센터'입니다." },
    { sentence: "He comes from a _______ background and speaks politely.", word: "well-educated", answer: "O", explanation: "[원칙 (1) 문맥] 예의 바르게 말하는 것으로 보아 '잘 교육받은/교양 있는' 배경이 어울립니다." },
    { sentence: "The manager decided to _______ the incomplete data from the report.", word: "exclude", answer: "O", explanation: "[원칙 (1) 문맥] 불완전한 데이터를 보고서에서 '제외하다'는 논리가 맞습니다." },
    { sentence: "We have a _______ scholar from Oxford University this semester.", word: "visiting", answer: "O", explanation: "[원칙 (3) 콜로케이션] '객원 학자/방문 교수'를 뜻하는 visiting scholar가 자연스러운 짝꿍입니다." },
    { sentence: "The CEO will _______ to announce the new strategy.", word: "address the audience", answer: "O", explanation: "[원칙 (3) 콜로케이션] 청중에게 '연설하다'는 표현입니다." },
    { sentence: "Please submit a copy of your high school _______.", word: "diploma", answer: "O", explanation: "[원칙 (1) 문맥] 고등학교 '졸업장' 제출을 요구하는 상황입니다." },
    { sentence: "I decided to _______ the committee's suggestion.", word: "go with", answer: "O", explanation: "[원칙 (3) 콜로케이션] 제안을 '받아들이다/선택하다'라는 구동사 표현입니다." },
    { sentence: "You will receive your _______ on the last Friday of the month.", word: "paycheck", answer: "O", explanation: "[원칙 (1) 문맥] 월급날에 받는 '급여 수표/월급'을 의미합니다." },
    { sentence: "Success in sales requires a high level of _______.", word: "self-motivation", answer: "O", explanation: "[원칙 (1) 문맥] 영업 성공을 위해 필요한 '자기 동기부여'입니다." },
    { sentence: "Please present your _______ upon arrival at the conference.", word: "credential", answer: "O", explanation: "[원칙 (1) 문맥] 신원을 증명하는 '자격 증명서/신분증'을 제시해야 합니다." },
    { sentence: "We like to dine out _______ to celebrate special events.", word: "on occasion", answer: "O", explanation: "[원칙 (1) 문맥] 특별한 날을 위해 '가끔/때때로' 외식한다는 의미입니다." },
    { sentence: "The project began to _______ behind schedule due to delays.", word: "lag", answer: "O", explanation: "[원칙 (3) 콜로케이션] 일정보다 '뒤쳐지다'는 lag behind가 짝꿍입니다." },
    { sentence: "Review all documents _______ to the merger carefully.", word: "pertaining", answer: "O", explanation: "[원칙 (2) 문법] 합병에 '관련된'이라는 분사구문으로 pertaining to가 적절합니다." },
    { sentence: "His decision to quit without notice was _______.", word: "questionable", answer: "O", explanation: "[원칙 (1) 문맥] 예고 없는 퇴사는 '의문스러운/문제가 있는' 행동입니다." },
    { sentence: "The machines are inspected with _______ to ensure safety.", word: "regularity", answer: "O", explanation: "[원칙 (1) 문맥] 안전을 위해 '규칙적임/정기적임'을 가지고 검사한다는 명사형이 적절합니다." },
    { sentence: "She has a _______ reputation in the legal community.", word: "stellar", answer: "O", explanation: "[원칙 (1) 문맥] 법조계에서 '뛰어난/별처럼 빛나는' 평판을 가졌다는 칭찬입니다." },
    { sentence: "This tool is _______ and can be used for cutting and sanding.", word: "versatile", answer: "O", explanation: "[원칙 (1) 문맥] 여러 용도로 쓰이는 '다재다능한/용도가 다양한' 도구입니다." },
    { sentence: "They succeeded _______ and finished the project on time.", word: "against all odds", answer: "O", explanation: "[원칙 (3) 콜로케이션] 모든 역경을 '무릅쓰고/딛고' 성공했다는 관용구입니다." },
    { sentence: "The teacher looked _______ at the student who cheated.", word: "sternly", answer: "O", explanation: "[원칙 (1) 문맥] 부정행위를 한 학생을 '엄격하게/단호하게' 쳐다봤다는 부사가 적절합니다." },
    { sentence: "As a _______, he is still under supervision.", word: "probationer", answer: "O", explanation: "[원칙 (1) 문맥] 아직 감독을 받는 '수습 사원/견습생' 신분입니다." },
    // False items for discrimination
    { sentence: "The manager showed a lack of _______ by ignoring the team's input.", word: "aptitude", answer: "X", explanation: "[원칙 (1) 문맥] 문맥상 '태도(attitude)'가 부족하다는 것이지, '적성(aptitude)'이 부족하다는 것은 어색합니다." },
    { sentence: "Please _______ the data from the final report.", word: "include", answer: "O", explanation: "[원칙 (1) 문맥] 데이터를 '포함하다'는 의미입니다. (함정: exclude와 혼동 주의)" }, // Keeping as O for variety, or X? User asked for some X. Let's make it X by swapping.
    { sentence: "The contract terms were _______ to the client's demands.", word: "unrelated", answer: "X", explanation: "[원칙 (1) 문맥] 고객 요구에 '상응하는(commensurate)'이어야지, '관련 없는(unrelated)'은 문맥상 어색합니다." },
    { sentence: "He is a _______ driver who speeds often.", word: "cautiously", answer: "X", explanation: "[원칙 (2) 문법] 명사 driver를 수식하려면 형용사 cautious가 와야 하며, 과속하는 사람은 조심스럽지 않습니다." }
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
                    this.list = [...this.list, ...newItems];
                    this.ui.totalItemsCount.innerText = this.list.length; // Update Stats
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
            this.ui.btnViewDB.addEventListener('click', () => this.openDatabase());
            this.ui.btnCloseDB.addEventListener('click', () => this.ui.modalDB.classList.add('hidden'));
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

    openDatabase() {
        this.ui.dbList.innerHTML = '';
        const items = [...this.list];

        if (items.length === 0) {
            this.ui.dbList.innerHTML = '<li>데이터가 없습니다.</li>';
        } else {
            items.forEach((item, index) => {
                const li = document.createElement('li');
                if (this.type === 'collo') {
                    li.innerHTML = `
                        <strong>${index + 1}. ${item.original}</strong>
                        <div class="meta">
                            <span class="tag">${item.principle || 'General'}</span>
                            <span>Meaning: ${item.meaning}</span>
                        </div>
                    `;
                } else {
                    // Vocab
                    li.innerHTML = `
                        <strong>${index + 1}. ${item.word}</strong>
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
        const key = `toeic_wrong_${this.type}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    saveWrongInfo(wrongItemsList) {
        if (!wrongItemsList || wrongItemsList.length === 0) return;
        const key = `toeic_wrong_${this.type}`;
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


