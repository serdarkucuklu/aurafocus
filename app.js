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
                
                const activeMode = document.querySelector('.mode-btn.active');
                if (activeMode && activeMode.dataset.time === "1500") {
                    recordFocusSession(25);
                }
                
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

function stopAllExcept(currentItem) {
    soundItems.forEach(item => {
        if (item !== currentItem) {
            const audio = item.querySelector('audio');
            const slider = item.querySelector('.volume-slider');
            const playIcon = item.querySelector('.sound-play-btn i');
            
            audio.pause();
            item.classList.remove('active');
            playIcon.className = 'fa-solid fa-play';
            slider.value = 0;
            audio.volume = 0;
        }
    });
}

soundItems.forEach(item => {
    const slider = item.querySelector('.volume-slider');
    const audio = item.querySelector('audio');
    const playBtn = item.querySelector('.sound-play-btn');
    const playIcon = playBtn.querySelector('i');
    
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            stopAllExcept(item);
            // Start at a standard 50% volume if it was at 0
            if (slider.value == 0) {
                slider.value = 50;
                audio.volume = 0.5;
            }
            audio.play().catch(err => console.log('Sound play blocked: ', err));
            item.classList.add('active');
            playIcon.className = 'fa-solid fa-pause';
        } else {
            audio.pause();
            item.classList.remove('active');
            playIcon.className = 'fa-solid fa-play';
        }
    });
    
    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        const volume = val / 100;
        audio.volume = volume;
        
        if (volume > 0) {
            stopAllExcept(item);
            item.classList.add('active');
            playIcon.className = 'fa-solid fa-pause';
            if (audio.paused) {
                audio.play().catch(err => console.log('Sound autoplay blocked: ', err));
            }
        } else {
            item.classList.remove('active');
            playIcon.className = 'fa-solid fa-play';
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
const leftAdList = document.getElementById('left-ad-list');
const rightAdList = document.getElementById('right-ad-list');

const fallbackProducts = [
    {
        title: "Ergonomik Masaüstü Monitör Yükseltici",
        price: "499 TL",
        image_url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=monitor+yukseltici&tag=aurafocus-21"
    },
    {
        title: "Minimalist Keçe Sümen (Masa Pedi)",
        price: "329 TL",
        image_url: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=kece+sumen&tag=aurafocus-21"
    },
    {
        title: "Akıllı Ayarlanabilir Monitör Işık Barı",
        price: "799 TL",
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=monitor+isik+bari&tag=aurafocus-21"
    },
    {
        title: "Hızlı Kablosuz Şarj Standı (3'ü 1 Arada)",
        price: "549 TL",
        image_url: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=kablosuz+sarj+standi&tag=aurafocus-21"
    },
    {
        title: "Minimalist Hakiki Deri Kalemlik",
        price: "199 TL",
        image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=deri+kalemlik&tag=aurafocus-21"
    },
    {
        title: "Ergonomik Dikey Kablosuz Mouse",
        price: "699 TL",
        image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=dikey+kablosuz+mouse&tag=aurafocus-21"
    },
    {
        title: "Alüminyum Ayarlanabilir Laptop Standı",
        price: "389 TL",
        image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=aluminyum+laptop+standi&tag=aurafocus-21"
    },
    {
        title: "Aydınlatmalı Minimal Masa Saati",
        price: "279 TL",
        image_url: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=150",
        affiliate_link: "https://www.amazon.com.tr/s?k=minimal+masa+saati&tag=aurafocus-21"
    }
];

async function loadDynamicContent() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 1. Load Daily Quote
        if (data.daily_quote) {
            quoteText.textContent = `"${data.daily_quote.quote}"`;
            quoteAuthor.textContent = `— ${data.daily_quote.author || 'Centilmenlik İlkesi'}`;
        }
        
        // Combine loaded products with fallback items to ensure rich skyscraper columns
        let allProducts = [];
        if (data.products && data.products.length > 0) {
            allProducts = [...data.products];
        }
        
        // Fill up to 8 products
        for (let item of fallbackProducts) {
            if (!allProducts.some(p => p.title.toLowerCase() === item.title.toLowerCase())) {
                allProducts.push(item);
            }
        }
        
        renderProducts(allProducts);
    } catch (err) {
        console.log('Error loading data.json feed: ', err);
        renderProducts(fallbackProducts);
    }
}

function renderProducts(products) {
    if (!leftAdList || !rightAdList) return;
    
    leftAdList.innerHTML = '';
    rightAdList.innerHTML = '';
    
    products.forEach((prod, index) => {
        const item = document.createElement('a');
        item.href = prod.affiliate_link || '#';
        item.target = '_blank';
        item.className = 'skyscraper-item';
        
        item.innerHTML = `
            <img src="${prod.image_url || 'https://via.placeholder.com/150'}" alt="${prod.title}" class="skyscraper-item-img">
            <div class="skyscraper-item-title">${prod.title}</div>
            <div class="skyscraper-item-price">${prod.price}</div>
        `;
        
        // Distribute evenly between left and right sidebars
        if (index % 2 === 0) {
            leftAdList.appendChild(item);
        } else {
            rightAdList.appendChild(item);
        }
    });
}

// ─── SOUND PRESETS ────────────────────────────────────────────────────────
const presets = {
    'rainy-library': { rain: 80, cafe: 0, waves: 0, lofi: 20 },
    'cyber-cafe': { rain: 30, cafe: 70, waves: 0, lofi: 10 },
    'ocean-breeze': { rain: 0, cafe: 0, waves: 65, lofi: 35 },
    'cozy-study': { rain: 10, cafe: 0, waves: 0, lofi: 85 }
};

function applyPreset(presetName) {
    const config = presets[presetName];
    if (!config) return;

    soundItems.forEach(item => {
        const soundType = item.dataset.sound;
        const volumeVal = config[soundType];
        const audio = item.querySelector('audio');
        const slider = item.querySelector('.volume-slider');
        const playIcon = item.querySelector('.sound-play-btn i');

        slider.value = volumeVal;
        audio.volume = volumeVal / 100;

        if (volumeVal > 0) {
            item.classList.add('active');
            playIcon.className = 'fa-solid fa-pause';
            audio.play().catch(err => console.log('Autoplay blocked: ', err));
        } else {
            item.classList.remove('active');
            playIcon.className = 'fa-solid fa-play';
            audio.pause();
        }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (btn.dataset.preset === presetName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ─── FOCUS TRACKER & ACTIVITY GRID ────────────────────────────────────────
function recordFocusSession(minutes) {
    let focusMinutes = parseInt(localStorage.getItem('focus_total_minutes')) || 0;
    focusMinutes += minutes;
    localStorage.setItem('focus_total_minutes', focusMinutes);

    const today = new Date().toDateString();
    let focusDates = JSON.parse(localStorage.getItem('focus_dates')) || [];
    if (!focusDates.includes(today)) {
        focusDates.push(today);
        localStorage.setItem('focus_dates', JSON.stringify(focusDates));
    }

    updateStreak();
    renderActivityGrid();
}

function updateStreak() {
    let focusDates = JSON.parse(localStorage.getItem('focus_dates')) || [];
    let streak = 0;
    
    if (focusDates.length > 0) {
        const dates = focusDates.map(d => new Date(d)).sort((a,b) => b - a);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let lastDate = dates[0];
        lastDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
            streak = 1;
            for (let i = 1; i < dates.length; i++) {
                const prevDate = dates[i];
                prevDate.setHours(0,0,0,0);
                const dayDiff = Math.ceil(Math.abs(lastDate - prevDate) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    streak++;
                    lastDate = prevDate;
                } else if (dayDiff > 1) {
                    break;
                }
            }
        }
    }

    const streakCountEl = document.getElementById('focus-streak-count');
    const totalMinsEl = document.getElementById('focus-total-mins');
    if (streakCountEl) streakCountEl.textContent = `🔥 ${streak} Gün`;
    if (totalMinsEl) {
        const totalMinutes = parseInt(localStorage.getItem('focus_total_minutes')) || 0;
        totalMinsEl.textContent = `${totalMinutes} dk`;
    }
}

function renderActivityGrid() {
    const gridEl = document.getElementById('activity-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const focusDates = JSON.parse(localStorage.getItem('focus_dates')) || [];
    
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateString = d.toDateString();
        
        const square = document.createElement('div');
        square.className = 'activity-day';
        
        if (focusDates.includes(dateString)) {
            square.classList.add('active');
        }
        
        square.title = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        gridEl.appendChild(square);
    }
}

// ─── INITIALIZE ──────────────────────────────────────────────────────────
updateDisplay();
renderTodos();
loadDynamicContent();
updateStreak();
renderActivityGrid();

// Preset buttons click listeners
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        applyPreset(btn.dataset.preset);
    });
});
