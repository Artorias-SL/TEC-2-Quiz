// ==========================================
// 1. MEZCLA ALEATORIA DE PREGUNTAS (SHUFFLE)
// ==========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Ejecutamos la mezcla inicial
shuffleArray(db);

// ==========================================
// 2. CONFIGURACIÓN Y ESTADO DEL SIMULADOR
// ==========================================
const questionsPerPage = 10;
let currentPage = 0;
let totalPages = Math.ceil(db.length / questionsPerPage);

let userAnswers = new Array(db.length).fill(null);
let isSubmitted = false;

let currentFilter = 'all'; 
let filteredIndices = Array.from({length: db.length}, (_, i) => i);

let timeLeft = 45* 60;
let timerInterval;

// Referencias al DOM (HTML)
const container = document.getElementById('quiz-container');
const progressEl = document.getElementById('progress');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const pageInfoEl = document.getElementById('page-info');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnRestart = document.getElementById('btn-restart'); // Referencia al nuevo botón
const tabsContainer = document.getElementById('tabs-container');

// ==========================================
// 3. FUNCIONES DEL CRONÓMETRO
// ==========================================
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerEl.innerText = "⏱️ Tiempo agotado";
            timerEl.classList.remove('timer-danger');
            alert("¡Se acabó el tiempo de 30 minutos! Enviando respuestas automáticamente.");
            submitExam(true);
        } else {
            timeLeft--;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    let s = (timeLeft % 60).toString().padStart(2, '0');
    timerEl.innerText = `⏱️ ${m}:${s}`;
    
    if (timeLeft <= 60 && !timerEl.classList.contains('timer-danger')) {
        timerEl.classList.add('timer-danger');
    }
}

// ==========================================
// 4. FUNCIONES DE INTERFAZ Y ESTADÍSTICAS
// ==========================================
function updateStats() {
    let answered = userAnswers.filter(ans => ans !== null).length;
    progressEl.innerText = `Respondidas: ${answered} / ${db.length}`;
    
    if (isSubmitted) {
        let correctCount = 0;
        userAnswers.forEach((ans, idx) => {
            if (ans === db[idx].a) correctCount++;
        });
        let percentage = Math.round((correctCount / db.length) * 100);
        scoreEl.innerText = `Puntuación: ${correctCount} de ${db.length} (${percentage}%)`;
        scoreEl.style.color = percentage >= 60 ? "var(--correct)" : "var(--incorrect)";
    } else {
        scoreEl.innerText = "Evaluación pendiente";
        scoreEl.style.color = "var(--text-color)";
    }
}

function updateControls() {
    btnPrev.disabled = currentPage === 0;
    btnNext.disabled = currentPage >= totalPages - 1;
    
    if (filteredIndices.length === 0) {
        pageInfoEl.innerText = `Página 0 de 0`;
    } else {
        pageInfoEl.innerText = `Página ${currentPage + 1} de ${totalPages}`;
    }
}

function setFilter(mode) {
    currentFilter = mode;
    currentPage = 0;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${mode}`).classList.add('active');

    if (mode === 'all') {
        filteredIndices = Array.from({length: db.length}, (_, i) => i);
    } else if (mode === 'correct') {
        filteredIndices = [];
        userAnswers.forEach((ans, idx) => {
            if (ans === db[idx].a) filteredIndices.push(idx);
        });
    } else if (mode === 'incorrect') {
        filteredIndices = [];
        userAnswers.forEach((ans, idx) => {
            if (ans !== db[idx].a) filteredIndices.push(idx);
        });
    }
    
    totalPages = Math.max(1, Math.ceil(filteredIndices.length / questionsPerPage));
    renderPage();
}

// ==========================================
// 5. RENDERIZADO DEL CUESTIONARIO
// ==========================================
function renderPage() {
    container.innerHTML = '';
    
    if (filteredIndices.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'question-card';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.innerText = 'No hay preguntas en esta categoría.';
        container.appendChild(emptyMsg);
        updateControls();
        return;
    }

    let start = currentPage * questionsPerPage;
    let end = Math.min(start + questionsPerPage, filteredIndices.length);

    for (let i = start; i < end; i++) {
        let dbIndex = filteredIndices[i];
        const item = db[dbIndex];
        
        const card = document.createElement('div');
        card.className = 'question-card';
        
        const questionTitle = document.createElement('div');
        questionTitle.className = 'question-text';
        questionTitle.innerHTML = `${i + 1}. ${item.q}`;
        
        const optionsList = document.createElement('ul');
        optionsList.className = 'options';
        
        const feedback = document.createElement('div');
        feedback.className = 'feedback';

        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.innerHTML = `<strong>Justificación:</strong> ${item.j}`;
        
        item.o.forEach((optText, optIndex) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.innerText = optText;
            
            if (userAnswers[dbIndex] === optIndex) {
                li.classList.add('selected');
            }
            
            if (isSubmitted) {
                li.classList.add('disabled');
                if (optIndex === item.a) {
                    li.classList.add('correct');
                } else if (userAnswers[dbIndex] === optIndex && optIndex !== item.a) {
                    li.classList.add('incorrect');
                }
            }

            li.onclick = () => {
                if (isSubmitted) return;
                
                Array.from(optionsList.children).forEach(child => child.classList.remove('selected'));
                li.classList.add('selected');
                userAnswers[dbIndex] = optIndex;
                updateStats();
            };
            
            optionsList.appendChild(li);
        });
        
        if (isSubmitted) {
            if (userAnswers[dbIndex] === item.a) {
                feedback.innerText = "✓ Respuesta Correcta";
                feedback.style.color = "var(--correct)";
            } else if (userAnswers[dbIndex] !== null) {
                feedback.innerText = "✗ Respuesta Incorrecta";
                feedback.style.color = "var(--incorrect)";
            } else {
                feedback.innerText = "⚠ No respondida";
                feedback.style.color = "#d29922";
            }
            feedback.style.display = "block";
            explanation.style.display = "block";
        }
        
        card.appendChild(questionTitle);
        card.appendChild(optionsList);
        card.appendChild(feedback);
        card.appendChild(explanation);
        container.appendChild(card);
    }
    
    updateControls();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(direction) {
    currentPage += direction;
    renderPage();
}

// ==========================================
// 6. ENVÍO Y REINICIO DEL CUESTIONARIO
// ==========================================
function submitExam(autoSubmit = false) {
    if (!autoSubmit) {
        const unanswered = userAnswers.filter(ans => ans === null).length;
        if (unanswered > 0) {
            const confirmSubmit = confirm(`Aún tienes ${unanswered} preguntas sin responder. ¿Seguro que quieres enviar el examen?`);
            if (!confirmSubmit) return;
        }
    }
    
    clearInterval(timerInterval);
    timerEl.style.display = 'none';
    isSubmitted = true;
    
    tabsContainer.classList.remove('hidden');
    
    // Ocultar botón enviar, mostrar botón reiniciar
    btnSubmit.classList.add('hidden');
    btnRestart.classList.remove('hidden');
    
    updateStats();
    setFilter('all');
}

// NUEVA FUNCIÓN: Restablece todo a 0, vuelve a mezclar e inicia de nuevo
function restartQuiz() {
    // 1. Volver a mezclar el banco de preguntas
    shuffleArray(db);
    
    // 2. Resetear variables y arrays
    userAnswers = new Array(db.length).fill(null);
    isSubmitted = false;
    currentPage = 0;
    filteredIndices = Array.from({length: db.length}, (_, i) => i);
    totalPages = Math.ceil(db.length / questionsPerPage);
    
    // 3. Resetear cronómetro
    clearInterval(timerInterval);
    timeLeft = 30 * 60;
    timerEl.style.display = 'inline-block';
    timerEl.classList.remove('timer-danger');
    startTimer();
    
    // 4. Restaurar la interfaz (botones y pestañas)
    tabsContainer.classList.add('hidden');
    btnSubmit.classList.remove('hidden');
    btnRestart.classList.add('hidden');
    
    // 5. Volver a pintar todo el cuestionario desde 0
    updateStats();
    setFilter('all'); // Esto forzará el renderPage()
}

// ==========================================
// 7. INICIO DEL SISTEMA
// ==========================================
startTimer();
renderPage();
updateStats();