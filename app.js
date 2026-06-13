// ─── POMODORO TIMER VARIABLES & LOGIC ──────────────────────────────────────
let timerInterval = null;
let timeLeft = 1500; // 25 minutes default
let timerRunning = false;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Başlat';
        timerRunning = false;
    } else {
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timerInterval);
                playAlarm();
                alert('Mola Zamanı!');
                resetTimer();
            }
        }, 1000);
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Duraklat';
        timerRunning = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Başlat';
    
    // Reset based on active mode
    const activeMode = document.querySelector('.mode-btn.active');
    timeLeft = parseInt(activeMode.dataset.time, 10);
    updateDisplay();
}

function playAlarm() {
    // Simple alarm beep using Web Audio API
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1); // beep for 1s
    } catch (e) {
        console.log('Audio Context alarm failed: ', e);
    }
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        timeLeft = parseInt(e.target.dataset.time, 10);
        resetTimer();
    });
});

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

// ─── AMBIENT SOUND CONTROLLER ─────────────────────────────────────────────
const soundItems = document.querySelectorAll('.sound-item');

soundItems.forEach(item => {
    const slider = item.querySelector('.volume-slider');
    const audio = item.querySelector('audio');
    
    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        const volume = val / 100;
        audio.volume = volume;
        
        if (volume > 0) {
            item.classList.add('active');
            if (audio.paused) {
                audio.play().catch(err => console.log('Sound autoplay blocked: ', err));
            }
        } else {
            item.classList.remove('active');
            audio.pause();
        }
    });
});

// ─── TO-DO LIST PERSISTENCE ────────────────────────────────────────────────
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');

let todos = JSON.parse(localStorage.getItem('aurafocus_todos')) || [];

function saveTodos() {
    localStorage.setItem('aurafocus_todos', JSON.stringify(todos));
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, idx) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        
        li.innerHTML = `
            <span class="todo-item-text ${todo.completed ? 'completed' : ''}" onclick="toggleTodo(${idx})">
                <i class="${todo.completed ? 'fa-regular fa-circle-check' : 'fa-regular fa-circle'}"></i>
                ${todo.text}
            </span>
            <button class="delete-todo-btn" onclick="deleteTodo(${idx})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        todoList.appendChild(li);
    });
}

window.toggleTodo = function(idx) {
    todos[idx].completed = !todos[idx].completed;
    saveTodos();
    renderTodos();
};

window.deleteTodo = function(idx) {
    todos.splice(idx, 1);
    saveTodos();
    renderTodos();
};

addTodoBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        saveTodos();
        renderTodos();
        todoInput.value = '';
    }
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodoBtn.click();
    }
});

// ─── DYNAMIC CONTENT LOAD (data.json) ──────────────────────────────────────
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const productList = document.getElementById('product-list');

async function loadDynamicContent() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 1. Load Daily Quote
        if (data.daily_quote) {
            quoteText.textContent = `"${data.daily_quote.quote}"`;
            quoteAuthor.textContent = `— ${data.daily_quote.author || 'Centilmenlik İlkesi'}`;
        }
        
        // 2. Load Curated Affiliate Products
        if (data.products && data.products.length > 0) {
            productList.innerHTML = '';
            data.products.forEach(prod => {
                const item = document.createElement('a');
                item.href = prod.affiliate_link || '#';
                item.target = '_blank';
                item.className = 'product-item';
                
                item.innerHTML = `
                    <img src="${prod.image_url || 'https://via.placeholder.com/60'}" alt="${prod.title}" class="product-img">
                    <div class="product-details">
                        <div class="product-title">${prod.title}</div>
                        <div class="product-price">${prod.price || 'Amazon\'da İncele'}</div>
                    </div>
                    <i class="fa-solid fa-arrow-right product-arrow"></i>
                `;
                productList.appendChild(item);
            });
        } else {
            productList.innerHTML = '<div class="product-item-placeholder">Şu an önerilen ürün bulunmuyor.</div>';
        }
    } catch (err) {
        console.log('Error loading data.json feed: ', err);
        // Fallback static products
        renderFallbackProducts();
    }
}

function renderFallbackProducts() {
    const fallback = [
        {
            title: "Minimalist Felt Desk Mat (Keçe Sümen)",
            price: "249 TL",
            image_url: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=150",
            affiliate_link: "https://www.amazon.com.tr/s?k=minimalist+kece+sumen&tag=aurafocus-21"
        },
        {
            title: "Mekanik Klavye - Gateron Brown Switch",
            price: "1.499 TL",
            image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150",
            affiliate_link: "https://www.amazon.com.tr/s?k=mekanik+klavye+gateron&tag=aurafocus-21"
        }
    ];
    productList.innerHTML = '';
    fallback.forEach(prod => {
        const item = document.createElement('a');
        item.href = prod.affiliate_link;
        item.target = '_blank';
        item.className = 'product-item';
        
        item.innerHTML = `
            <img src="${prod.image_url}" alt="${prod.title}" class="product-img">
            <div class="product-details">
                <div class="product-title">${prod.title}</div>
                <div class="product-price">${prod.price}</div>
            </div>
            <i class="fa-solid fa-arrow-right product-arrow"></i>
        `;
        productList.appendChild(item);
    });
}

// ─── INITIALIZE ──────────────────────────────────────────────────────────
updateDisplay();
renderTodos();
loadDynamicContent();
