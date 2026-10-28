// =========================================================
// 智慧頌缽療癒機器人 - 單週一覽與日期權限防呆邏輯
// =========================================================

// 當前顯示週別的參考日期 (預設為今天)
let currentWeekAnchorDate = new Date();
let selectedDiaryDate = new Date();

// 歷史對話與情緒資料庫
const mockDatabase = {
    "2026-09-28": {
        time: "13:00",
        emoji: "😊",
        moodText: "平靜放鬆",
        reportText: "身心狀況良好，心率表現穩定，建議進行 10 分鐘 432Hz 音療來維持心情安定。",
        chat: [
            { sender: "bot", text: "你好！我是你的頌缽療癒 AI 助手，今天感覺如何？" },
            { sender: "user", text: "覺得心情滿輕鬆的，來記錄一下。" },
            { sender: "bot", text: "太棒了！已為你儲存今天的平靜狀態。" }
        ]
    },
    "2026-09-25": {
        time: "18:30",
        emoji: "😰",
        moodText: "焦慮壓力",
        reportText: "檢測到心率波動偏高，交感神經較為活躍，建議適度進行頌缽敲擊來紓緩緊張情緒。",
        chat: [
            { sender: "bot", text: "檢測到你的心率有些偏高，需要安排音療嗎？" },
            { sender: "user", text: "今天事情有點多，壓力蠻大的。" },
            { sender: "bot", text: "請放鬆心情，隨時可以啟動頌缽手臂為你進行 15 分鐘療程喔。" }
        ]
    },
    "2026-10-18": {
        time: "09:20",
        emoji: "😌",
        moodText: "平靜（2/5）",
        reportText: "今天整體心情平穩，適合照自己的步調安排活動。",
        chat: [
            { sender: "bot", text: "早安，今天起床後感覺如何？" },
            { sender: "user", text: "睡得還不錯，今天心情很平靜，想慢慢整理房間。" },
            { sender: "bot", text: "聽起來是舒服又安穩的一天，慢慢來就好。" }
        ]
    },
    "2026-10-20": {
        time: "14:35",
        emoji: "😢",
        moodText: "悲傷（3/5）",
        reportText: "今天有些失落，先給自己一點休息和調整的空間。",
        chat: [
            { sender: "bot", text: "今天有沒有什麼事情留在心裡？" },
            { sender: "user", text: "和朋友道別後有點失落，心情悶悶的。" },
            { sender: "bot", text: "離別時感到失落很自然，可以先做些讓自己舒服的小事。" }
        ]
    },
    "2026-10-22": {
        time: "11:10",
        emoji: "😊",
        moodText: "快樂（4/5）",
        reportText: "今天心情明亮愉快，和人互動帶來不少好心情。",
        chat: [
            { sender: "bot", text: "今天有遇到讓你開心的事嗎？" },
            { sender: "user", text: "收到同學稱讚，準備的事情也很順利，今天很有成就感。" },
            { sender: "bot", text: "恭喜你！記得也肯定自己付出的努力。" }
        ]
    },
    "2026-10-24": {
        time: "19:45",
        emoji: "😰",
        moodText: "焦慮（3/5）",
        reportText: "對即將到來的安排有些緊張，可以把事情拆成幾個小步驟。",
        chat: [
            { sender: "bot", text: "想到接下來的安排時，心裡有什麼感受？" },
            { sender: "user", text: "下週事情排得有點滿，我有些緊張，怕來不及準備。" },
            { sender: "bot", text: "先列出最重要的一兩件事，逐步完成，可能會比較安心。" }
        ]
    },
    "2026-10-25": {
        time: "10:15",
        emoji: "😊",
        moodText: "快樂（2/5）",
        reportText: "今天心情輕鬆，整體感覺愉快。",
        chat: [
            { sender: "bot", text: "今天的心情如何？" },
            { sender: "user", text: "今天心情不錯，和朋友聊天後覺得很開心。" },
            { sender: "bot", text: "聽起來今天有愉快的時刻，記下這份好心情吧。" }
        ]
    },
    "2026-10-26": {
        time: "16:40",
        emoji: "😴",
        moodText: "疲憊（3/5）",
        reportText: "今天精神較累，適合留些時間休息。",
        chat: [
            { sender: "bot", text: "今天身心狀態還好嗎？" },
            { sender: "user", text: "今天事情很多，覺得有點累，想早點休息。" },
            { sender: "bot", text: "辛苦了，今天可以先放慢步調，讓自己休息一下。" }
        ]
    },
    "2026-10-27": {
        time: "20:05",
        emoji: "😰",
        moodText: "焦慮（4/5）",
        reportText: "對明天的安排感到緊張，壓力較明顯。",
        chat: [
            { sender: "bot", text: "有什麼事情讓你今天特別掛心嗎？" },
            { sender: "user", text: "明天要報告，我很緊張，擔心自己講不好。" },
            { sender: "bot", text: "面對重要報告會緊張很正常，可以先試著慢慢呼吸，整理好開頭要說的重點。" }
        ]
    }
};

// 將日記與對話保存在目前裝置的瀏覽器儲存空間，重新整理後還原。
const DIARY_STORAGE_KEY = "myarmapp_diary_v1";

function restoreDiaryDatabase() {
    try {
        const saved = localStorage.getItem(DIARY_STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            Object.assign(mockDatabase, parsed);
            let removedOldTestLabel = false;
            Object.values(mockDatabase).forEach(record => {
                if (!record || typeof record !== "object") return;
                if (typeof record.reportText === "string" && record.reportText.includes("【圖表測試】")) {
                    record.reportText = record.reportText.replaceAll("【圖表測試】", "").trim();
                    removedOldTestLabel = true;
                }
                if (Array.isArray(record.chat)) {
                    record.chat.forEach(message => {
                        if (message && typeof message.text === "string" && message.text.includes("【圖表測試】")) {
                            message.text = message.text.replaceAll("【圖表測試】", "").trim();
                            removedOldTestLabel = true;
                        }
                    });
                }
            });
            if (removedOldTestLabel) persistDiaryDatabase();
        }
    } catch (error) {
        console.warn("無法讀取已保存的日記資料：", error);
    }
}

function persistDiaryDatabase() {
    try {
        localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(mockDatabase));
    } catch (error) {
        console.warn("無法保存日記資料：", error);
    }
}

restoreDiaryDatabase();

// 格式化日期 key (YYYY-MM-DD)
function formatDateKey(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        dateObj = new Date();
    }
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 判斷是否為「今天」
function isToday(dateObj) {
    const today = new Date();
    return dateObj.getFullYear() === today.getFullYear() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getDate() === today.getDate();
}

// 判斷是否為「未來日期」
function isFuture(dateObj) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);
    return target > today;
}

// 1. 分頁導覽
function initTabNavigation() {
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    const pages = document.querySelectorAll(".page");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.dataset.target;
            navItems.forEach(n => n.classList.remove("active"));
            pages.forEach(p => p.classList.remove("active"));

            item.classList.add("active");
            const targetPage = document.getElementById(targetId);
            if (targetPage) targetPage.classList.add("active");
        });
    });
}

// 2. 情緒定位 Canvas
function initEmotionCanvas() {
    const moodItems = document.querySelectorAll(".mood-item");
    moodItems.forEach(item => {
        item.addEventListener("click", () => {
            moodItems.forEach(m => m.classList.remove("active"));
            item.classList.add("active");
        });
    });

    const canvas = document.getElementById("emotion-canvas");
    const pointer = document.getElementById("pointer");
    const btnClear = document.getElementById("btn-clear-pointer");

    if (canvas && pointer) {
        canvas.addEventListener("click", (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            pointer.style.left = `${x}px`;
            pointer.style.top = `${y}px`;
            pointer.style.display = "block";
        });
    }

    if (btnClear && pointer) {
        btnClear.addEventListener("click", () => {
            pointer.style.display = "none";
        });
    }
}

// 3. 渲染「單週」7天日期（含未來日期防呆）
function renderWeekGrid() {
    const weekLabel = document.getElementById("current-week-display");
    const gridContainer = document.getElementById("week-grid");

    if (!weekLabel || !gridContainer) return;

    // 計算當前 AnchorDate 所在的週日 (Sunday)
    const anchor = new Date(currentWeekAnchorDate);
    const dayOfWeek = anchor.getDay(); // 0 是週日
    const startOfWeek = new Date(anchor);
    startOfWeek.setDate(anchor.getDate() - dayOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // 更新抬頭顯示，如: "2026/09/27 - 2026/10/03"
    const startStr = `${startOfWeek.getFullYear()}/${String(startOfWeek.getMonth() + 1).padStart(2, '0')}/${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const endStr = `${endOfWeek.getFullYear()}/${String(endOfWeek.getMonth() + 1).padStart(2, '0')}/${String(endOfWeek.getDate()).padStart(2, '0')}`;
    const weekText = `${startStr} - ${endStr}`;
    
    weekLabel.textContent = weekText;
    renderEmotionWeekChart(startOfWeek);

    gridContainer.innerHTML = "";

    // 依序產生當週 7 天 (週日~週六)
    for (let i = 0; i < 7; i++) {
        const thisDate = new Date(startOfWeek);
        thisDate.setDate(startOfWeek.getDate() + i);
        const dateKey = formatDateKey(thisDate);

        const cell = document.createElement("div");
        cell.className = "cal-day-cell";
        cell.textContent = thisDate.getDate();

        // 檢查是否為未來日期（防呆）
        if (isFuture(thisDate)) {
            cell.classList.add("disabled");
        } else {
            if (mockDatabase[dateKey]) {
                cell.classList.add("has-record");
            }

            if (formatDateKey(selectedDiaryDate) === dateKey) {
                cell.classList.add("selected");
            }

            cell.addEventListener("click", () => {
                selectedDiaryDate = thisDate;
                renderWeekGrid();
                loadChatHistoryByDate(selectedDiaryDate);
            });
        }

        gridContainer.appendChild(cell);
    }
}

const EMOTION_CHART_CATEGORIES = ["快樂", "平靜", "驚訝", "焦慮", "憤怒", "悲傷", "疲憊", "其他"];
const EMOTION_CHART_COLORS = {
    "快樂": "#f59e0b",
    "平靜": "#10b981",
    "驚訝": "#a855f7",
    "焦慮": "#ef4444",
    "憤怒": "#f97316",
    "悲傷": "#3b82f6",
    "疲憊": "#64748b",
    "其他": "#94a3b8"
};

function getChartEmotion(moodText) {
    const text = String(moodText || "");
    if (/快樂|愉悅|幸福|滿足/.test(text)) return "快樂";
    if (/平靜|放鬆|安心|平穩/.test(text)) return "平靜";
    if (/驚訝/.test(text)) return "驚訝";
    if (/焦慮|恐懼|緊張|壓力/.test(text)) return "焦慮";
    if (/憤怒|生氣|厭惡|煩悶/.test(text)) return "憤怒";
    if (/悲傷|難過|低落/.test(text)) return "悲傷";
    if (/疲憊|疲倦|好睏|沒精神/.test(text)) return "疲憊";
    return "其他";
}

function renderEmotionWeekChart(startOfWeek) {
    const chart = document.getElementById("emotion-week-chart");
    const weekLabel = document.getElementById("emotion-week-range-label");
    const dayLabels = document.getElementById("emotion-week-labels");
    const legend = document.getElementById("emotion-legend");
    if (!chart || !dayLabels || !legend) return;

    const weekDates = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date;
    });
    const weekEnd = weekDates[6];
    if (weekLabel) {
        weekLabel.textContent = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}–${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    }

    const plotLeft = 64;
    const plotRight = 330;
    const plotTop = 13;
    const rowGap = 17.5;
    const points = weekDates.map((date, index) => {
        // 本週只畫到今天，未來日期保留空白。
        if (isFuture(date)) return null;
        const record = mockDatabase[formatDateKey(date)];
        const hasMoodRecord = record && record.moodText && !/無紀錄/.test(record.moodText);
        const emotion = hasMoodRecord ? getChartEmotion(record.moodText) : "其他";
        const intensityMatch = hasMoodRecord ? String(record.moodText).match(/([1-5])\s*\/\s*5/) : null;
        const intensity = intensityMatch ? `，${intensityMatch[1]}/5` : "";
        return {
            x: plotLeft + (plotRight - plotLeft) * index / 6,
            y: plotTop + EMOTION_CHART_CATEGORIES.indexOf(emotion) * rowGap,
            emotion,
            title: `${date.getMonth() + 1}/${date.getDate()} ${emotion}${intensity}`
        };
    });

    const grid = EMOTION_CHART_CATEGORIES.map((emotion, index) => {
        const y = plotTop + index * rowGap;
        return `<line x1="${plotLeft}" y1="${y}" x2="${plotRight}" y2="${y}" stroke="#f0f0f5" stroke-width="1"/>`;
    }).join("");

    const segments = points.map((point, index) => {
        const next = points[index + 1];
        if (!point || !next) return "";
        return `<line x1="${point.x}" y1="${point.y}" x2="${next.x}" y2="${next.y}" stroke="${EMOTION_CHART_COLORS[next.emotion]}" stroke-width="3" stroke-linecap="round"/>`;
    }).join("");

    const markers = points.map(point =>
        point
            ? `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${EMOTION_CHART_COLORS[point.emotion]}" stroke="#ffffff" stroke-width="2"><title>${point.title}</title></circle>`
            : ""
    ).join("");

    chart.innerHTML = `${grid}${segments}${markers}`;
    dayLabels.innerHTML = weekDates.map(date => `<span>${date.getMonth() + 1}/${date.getDate()}</span>`).join("");
    legend.innerHTML = EMOTION_CHART_CATEGORIES.map(emotion =>
        `<span class="emotion-legend-item"><i class="emotion-legend-dot" style="background:${EMOTION_CHART_COLORS[emotion]}"></i>${emotion}</span>`
    ).join("");
}

// 載入指定日期的情緒與對話紀錄（含過去日期權限限制）
function loadChatHistoryByDate(dateObj) {
    const dateKey = formatDateKey(dateObj);
    const data = mockDatabase[dateKey];
    const canEdit = isToday(dateObj); // 只有「今天」可以點擊傳送與刪除

    const titleEl = document.getElementById("selected-date-title");
    const timeEl = document.getElementById("diary-record-time");
    const emojiEl = document.getElementById("diary-mood-emoji");
    const moodTextEl = document.getElementById("diary-mood-text");
    const chatContainer = document.getElementById("chat-container");

    const btnClearChat = document.getElementById("btn-clear-chat");
    const chatInputArea = document.querySelector(".chat-input-area");

    if (titleEl) titleEl.textContent = `${dateKey.replace(/-/g, '/')} 的情緒紀錄`;
    if (chatContainer) chatContainer.innerHTML = "";

    // 控制「清空對話」按鈕與「輸入框區域」顯示權限
    if (btnClearChat) {
        btnClearChat.style.display = canEdit ? "block" : "none";
    }
    if (chatInputArea) {
        chatInputArea.style.display = canEdit ? "flex" : "none";
    }

    if (data) {
        if (timeEl) timeEl.textContent = data.time;
        if (emojiEl) emojiEl.textContent = data.emoji;
        if (moodTextEl) moodTextEl.textContent = String(data.moodText).replace(/\s*[（(][^）)]*[）)]\s*$/, "");

        data.chat.forEach(msg => appendBubble(msg.sender, msg.text));
    } else {
        if (timeEl) timeEl.textContent = "--:--";
        if (emojiEl) emojiEl.textContent = "😶";
        if (moodTextEl) moodTextEl.textContent = "無紀錄";

        appendBubble("bot", `📅 ${dateKey} 這天尚無對話紀錄。`);
    }

    // 若為歷史日期，額外加入唯讀提示標籤
    if (!canEdit) {
        const lockNotice = document.createElement("div");
        lockNotice.className = "chat-lock-notice";
        lockNotice.textContent = "🔒 歷史對話紀錄僅供檢視，無法修改或對話";
        chatContainer.appendChild(lockNotice);
    }
}

function appendBubble(sender, text) {
    const chatContainer = document.getElementById("chat-container");
    if (!chatContainer) return;

    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}`;
    bubble.textContent = text;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// 依使用者描述判斷心情，並產生對應的陪伴回覆。
// 通報伺服器 API 網址：填入你自己的後端端點，才能實際送出通報。
// 請勿在前端放置 API 密鑰；通報資料應由受控的後端接收與處理。
const CRISIS_REPORT_ENDPOINT = "";

function isSelfHarmCrisis(text) {
    const normalized = String(text || "")
        .toLowerCase()
        .replace(/[\s　，。！？、；：,.!?;:'"“”‘’（）()【】\[\]{}<>《》]/g, "");

    // 使用字詞命中即觸發，不因否定句、引用或談論他人而略過。
    const riskTerms = [
        "自殺", "自盡", "輕生", "尋死", "想死", "去死", "不想活", "活不下去",
        "結束生命", "結束自己的生命", "了結生命", "自我了斷", "死了算了",
        "自殘", "自傷", "自我傷害", "傷害自己", "傷害我自己", "割腕", "割脈",
        "割自己", "吞藥自殺", "自殺念頭", "自傷念頭", "自殘念頭",
        "suicide", "suicidal", "killmyself", "endmylife", "selfharm", "self-harm",
        "hurtmyself", "harmmyself", "dontwanttolive", "don'twanttolive"
    ];

    return riskTerms.some(term => normalized.includes(term.replace(/[\s-']/g, "")));
}

function showCrisisModal(message) {
    const overlay = document.getElementById("crisis-overlay");
    const messageEl = document.getElementById("crisis-message");
    if (messageEl && message) messageEl.textContent = message;
    if (overlay) overlay.classList.add("show");
}

function setCrisisReportStatus(message) {
    const statusEl = document.getElementById("crisis-report-status");
    if (statusEl) statusEl.textContent = message;
}

async function reportCrisis(text, dateKey) {
    if (!CRISIS_REPORT_ENDPOINT) {
        return "⚠️ 尚未設定通報伺服器，因此這則訊息沒有實際送出通報。若有人正處於立即危險，請現在撥打 119；也可撥 24 小時安心專線 1925。";
    }
    try {
        const response = await fetch(CRISIS_REPORT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "self_harm_crisis",
                message: text,
                date: dateKey,
                timestamp: new Date().toISOString()
            }),
            keepalive: true
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return "🚨 危機訊息已送交通報伺服器。若有人正處於立即危險，請同時撥打 119；也可撥 24 小時安心專線 1925。";
    } catch (error) {
        console.error("危機通報失敗：", error);
        return "⚠️ 危機通報伺服器連線失敗，訊息尚未確認送達。若有人正處於立即危險，請現在撥打 119；也可撥 24 小時安心專線 1925。";
    }
}
function detectMoodFromText(text) {
    const normalizedText = String(text || "").toLowerCase();
    const fatigueNegated = /(?:不|沒|沒有|並不|不太)(?:會|覺得|感到|那麼|這麼|很)?(?:太)?(?:累|疲憊|疲倦|好睏|沒精神)/.test(normalizedText);
    const rules = [
        ["焦慮", /焦慮|緊張|擔心|壓力|慌|煩躁|不安/],
        ["悲傷", /悲傷|難過|傷心|低落|失望|想哭|孤單/],
        ["憤怒", /生氣|憤怒|火大|氣死|不爽|惱怒/],
        ["疲憊", /疲憊|疲倦|筋疲力盡|精疲力竭|好累|很累|超累|累壞|累死|累|好睏|沒精神|耗盡/],
        ["快樂", /快樂|開心|高興|愉快|幸福|滿足/],
        ["平靜", /平靜|放鬆|安心|平穩|舒服/]
    ];
    const found = rules.find(([mood, pattern]) =>
        pattern.test(normalizedText) && !(mood === "疲憊" && fatigueNegated)
    );
    return found ? found[0] : null;
}

function getMoodInfo(mood) {
    const choices = {
        "平靜": { emoji: "😌", label: "平靜放鬆" },
        "快樂": { emoji: "😊", label: "快樂愉悅" },
        "焦慮": { emoji: "😰", label: "焦慮壓力" },
        "悲傷": { emoji: "😢", label: "悲傷低落" },
        "憤怒": { emoji: "😠", label: "生氣煩悶" },
        "疲憊": { emoji: "😴", label: "疲憊需要休息" }
    };
    return choices[mood] || { emoji: "💬", label: mood || "日常記錄" };
}

async function requestAIReply(chatHistory) {
    const validHistory = chatHistory.filter(
        message => message.sender === "user" || message.sender === "bot"
    );
    const messages = validHistory
        .slice(-20)
        .map(message => ({
            role: message.sender === "bot" ? "assistant" : "user",
            content: message.text
        }));
    const allUserMessages = validHistory
        .filter(message => message.sender === "user")
        .map(message => String(message.text || "").trim())
        .filter(Boolean);
    let dailyConversationContext = allUserMessages.join("\n");
    if (dailyConversationContext.length > 6000) {
        dailyConversationContext = `${dailyConversationContext.slice(0, 3000)}\n（較早與較新的訊息之間有部分內容省略）\n${dailyConversationContext.slice(-3000)}`;
    }

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, dailyConversationContext })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "AI 暫時無法回覆，請稍後再試。");
    }

    return {
        is_out_of_scope: Boolean(data.is_out_of_scope),
        primary_emotion: data.primary_emotion || "無",
        emotion_intensity: Number(data.emotion_intensity) || 0,
        summary: data.summary || "",
        counselor_response: data.counselor_response || "我在聽，你願意再多告訴我一些嗎？",
        relaxation_guidance: data.relaxation_guidance || "",
        safety_alert: Boolean(data.safety_alert)
    };
}

// 單週切換與對話事件
function initWeekEvents() {
    const btnPrevWeek = document.getElementById("btn-prev-week");
    const btnNextWeek = document.getElementById("btn-next-week");

    if (btnPrevWeek) {
        btnPrevWeek.addEventListener("click", () => {
            currentWeekAnchorDate.setDate(currentWeekAnchorDate.getDate() - 7);
            renderWeekGrid();
        });
    }

    if (btnNextWeek) {
        btnNextWeek.addEventListener("click", () => {
            currentWeekAnchorDate.setDate(currentWeekAnchorDate.getDate() + 7);
            renderWeekGrid();
        });
    }

    const btnSend = document.getElementById("btn-chat-send");
    const chatInput = document.getElementById("chat-input");

    let isSending = false;
    const sendMessage = async () => {
        // 安全檢查：只有今天才能發送訊息
        if (!isToday(selectedDiaryDate)) return;

        const text = chatInput.value.trim();
        if (!text || isSending) return;

        const dateKey = formatDateKey(selectedDiaryDate);
        if (!mockDatabase[dateKey]) {
            mockDatabase[dateKey] = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                emoji: "💬",
                moodText: "日常記錄",
                reportText: "本日有新增諮詢對話。",
                chat: []
            };
        }

        const record = mockDatabase[dateKey];
        record.chat.push({ sender: "user", text });
        persistDiaryDatabase();
        appendBubble("user", text);
        chatInput.value = "";

        if (isSelfHarmCrisis(text)) {
            const immediateReply = "我很擔心你或你提到的人目前的安全。請先到有其他人在的安全地方，並把可能造成傷害的物品交給可信任的人。";
            showCrisisModal(immediateReply);
            reportCrisis(text, dateKey).then(reply => {
                setCrisisReportStatus(reply);
                renderWeekGrid();
            });
            renderWeekGrid();
            return;
        }
        const mood = detectMoodFromText(text) || record.moodText || "平靜";
        const moodInfo = getMoodInfo(mood);
        record.emoji = moodInfo.emoji;
        record.moodText = moodInfo.label;
        record.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        record.reportText = `你今天感覺${moodInfo.label}。可以先照顧自己的節奏，試著做幾次緩慢深呼吸。`;
        persistDiaryDatabase();

        isSending = true;
        const sendButton = document.getElementById("btn-chat-send");
        const chatContainer = document.getElementById("chat-container");
        const pendingBubble = document.createElement("div");
        pendingBubble.className = "bubble bot";
        pendingBubble.textContent = "我在想想怎麼回應你…";
        chatContainer.appendChild(pendingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (sendButton) sendButton.disabled = true;

        try {
            const result = await requestAIReply(record.chat);
            const replyParts = [result.counselor_response];
            if (result.relaxation_guidance) replyParts.push(`放鬆引導：${result.relaxation_guidance}`);
            const reply = replyParts.join("\n\n");
            if (result.safety_alert) {
                pendingBubble.remove();
                showCrisisModal(reply);
            } else {
                record.chat.push({ sender: "bot", text: reply });
                pendingBubble.textContent = reply;
            }

            if (result.is_out_of_scope) {
                record.moodText = "無紀錄";
                record.emoji = "💬";
                record.reportText = "這則訊息不屬於情緒紀錄範圍。";
            } else {
                const emotionMood = {
                    "快樂": "快樂",
                    "悲傷": "悲傷",
                    "恐懼": "焦慮",
                    "厭惡": "憤怒",
                    "憤怒": "憤怒",
                    "驚訝": "平靜",
                    "疲憊": "疲憊"
                }[result.primary_emotion] || mood;
                const emotionInfo = getMoodInfo(emotionMood);
                record.emoji = emotionInfo.emoji;
                record.moodText = `${emotionMood}（${result.emotion_intensity}/5）`;
                record.reportText = result.summary || `AI 綜合今日對話，判斷主要情緒為${emotionMood}，整體強度 ${result.emotion_intensity}/5。`;
            }

            if (result.safety_alert) {
                reportCrisis(text, dateKey).then(reportMessage => {
                    setCrisisReportStatus(reportMessage);
                    renderWeekGrid();
                });
            }
            persistDiaryDatabase();
        } catch (error) {
            const errorMessage = `AI 連線失敗：${error.message}`;
            pendingBubble.textContent = errorMessage;
            record.chat.push({ sender: "bot", text: errorMessage });
            persistDiaryDatabase();
        } finally {
            isSending = false;
            if (sendButton) sendButton.disabled = false;
        }

        renderWeekGrid();
    };

    if (btnSend && chatInput) {
        btnSend.addEventListener("click", sendMessage);
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }

    const btnClear = document.getElementById("btn-clear-chat");
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            // 安全檢查：只有今天才能清空紀錄
            if (!isToday(selectedDiaryDate)) return;

            const dateKey = formatDateKey(selectedDiaryDate);
            if (mockDatabase[dateKey]) mockDatabase[dateKey].chat = [];
            persistDiaryDatabase();
            loadChatHistoryByDate(selectedDiaryDate);
        });
    }
}


// ESP32 USB 序列埠連線。預設韌體通訊格式：115200 baud、每行一筆 JSON。
let esp32Port = null;
let esp32Reader = null;
let treatmentTimer = null;
let treatmentSecondsLeft = 0;

async function writeToESP32(command) {
    if (!esp32Port || !esp32Port.writable) throw new Error("ESP32 尚未連線");
    const writer = esp32Port.writable.getWriter();
    try {
        await writer.write(new TextEncoder().encode(command + "\n"));
    } finally {
        writer.releaseLock();
    }
}

function setESP32Connected(connected) {
    const button = document.getElementById("esp32-connect-btn");
    const robotStatus = document.getElementById("robot-status-text");
    if (button) {
        button.textContent = connected ? "ESP32 已連線" : "連接 ESP32";
        button.classList.toggle("connected", connected);
    }
    if (robotStatus && !treatmentTimer) {
        robotStatus.textContent = connected ? "手臂狀態：ESP32 已連線待命" : "手臂狀態：尚未連線";
    }
    const statusBar = document.getElementById("status-bar");
    if (statusBar && !treatmentTimer) {
        statusBar.textContent = connected ? "系統狀態：ESP32 已連線待命" : "系統狀態：ESP32 尚未連線";
    }
}

function handleESP32Line(line) {
    if (!line.trim()) return;
    try {
        const data = JSON.parse(line);
        const bpm = Number(data.heartRate ?? data.heart_rate ?? data.bpm);
        const respiration = Number(data.respiration ?? data.hrv ?? data.respirationPercent);
        if (Number.isFinite(bpm) && bpm > 0) {
            const el = document.getElementById("bio-heart-rate");
            if (el) el.innerHTML = `${Math.round(bpm)} <small>BPM</small>`;
        }
        if (Number.isFinite(respiration) && respiration >= 0) {
            const value = Math.max(0, Math.min(100, Math.round(respiration)));
            const el = document.getElementById("bio-respiration");
            if (el) el.textContent = `${value}%`;
        }
        if (data.status) {
            const bar = document.getElementById("status-bar");
            if (bar) bar.textContent = `ESP32：${String(data.status)}`;
        }
    } catch {
        // 忽略不是 JSON 的序列埠訊息，避免干擾原有畫面。
    }
}

async function readESP32Loop(port) {
    const decoder = new TextDecoder();
    let buffer = "";
    while (port.readable && esp32Port === port) {
        esp32Reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await esp32Reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || "";
                lines.forEach(handleESP32Line);
            }
        } catch (error) {
            console.error("ESP32 讀取錯誤：", error);
        } finally {
            esp32Reader.releaseLock();
            esp32Reader = null;
        }
    }
}

async function connectESP32() {
    if (!("serial" in navigator)) {
        alert("此瀏覽器不支援 Web Serial。請使用最新版 Chrome 或 Edge，並以 HTTPS 或 localhost 開啟此頁面。");
        return;
    }
    const button = document.getElementById("esp32-connect-btn");
    if (button) { button.disabled = true; button.textContent = "連線中…"; }
    try {
        if (esp32Port) {
            const oldPort = esp32Port;
            esp32Port = null;
            if (esp32Reader) await esp32Reader.cancel().catch(() => {});
            await oldPort.close();
            setESP32Connected(false);
            return;
        }
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        esp32Port = port;
        setESP32Connected(true);
        readESP32Loop(port);
    } catch (error) {
        if (error.name !== "NotFoundError") alert(`ESP32 連線失敗：${error.message}`);
        setESP32Connected(false);
    } finally {
        if (button) button.disabled = false;
    }
}

function stopTreatmentTimer() {
    if (treatmentTimer) clearInterval(treatmentTimer);
    treatmentTimer = null;
    const start = document.getElementById("btn-start-treatment");
    const stop = document.getElementById("btn-stop-treatment");
    const status = document.getElementById("robot-status-text");
    if (start) start.style.display = "block";
    if (stop) stop.style.display = "none";
    if (status) status.textContent = esp32Port ? "手臂狀態：ESP32 已連線待命" : "手臂狀態：尚未連線";
    const bar = document.getElementById("status-bar");
    if (bar) bar.textContent = esp32Port ? "系統狀態：療程已完成 / ESP32 待命" : "系統狀態：療程停止 / ESP32 尚未連線";
}

function getTodayTreatmentPlan() {
    const dateKey = formatDateKey(new Date());
    const record = mockDatabase[dateKey];
    const recordedMood = record ? String(record.moodText || "") : "";
    const intensityMatch = recordedMood.match(/([1-5])\s*\/\s*5/);
    const intensity = intensityMatch ? Number(intensityMatch[1]) : 0;

    let mood = "平靜";
    let treatmentName = "日常放鬆";
    let minutes = 5;

    if (/焦慮|恐懼|緊張/.test(recordedMood)) {
        mood = "焦慮";
        treatmentName = "安定放鬆";
        minutes = intensity >= 4 ? 10 : 5;
    } else if (/悲傷|低落/.test(recordedMood)) {
        mood = "悲傷";
        treatmentName = "溫和舒緩";
        minutes = intensity >= 4 ? 10 : 5;
    } else if (/憤怒|生氣|厭惡/.test(recordedMood)) {
        mood = "憤怒";
        treatmentName = "平穩放鬆";
        minutes = intensity >= 4 ? 10 : 5;
    } else if (/疲憊|疲倦/.test(recordedMood)) {
        mood = "疲憊";
        treatmentName = "短時休息";
        minutes = intensity >= 4 ? 10 : 5;
    } else if (/快樂|愉悅/.test(recordedMood)) {
        mood = "快樂";
        treatmentName = "日常維持";
    }

    return {
        dateKey,
        mood,
        recordedMood: recordedMood || "尚無今日情緒紀錄",
        treatmentName,
        minutes,
        frequency: 432
    };
}

function updateTreatmentRecommendation() {
    const plan = getTodayTreatmentPlan();
    const detail = document.getElementById("robot-detail");
    const reportText = document.getElementById("robot-report-text");
    const selectedOption = document.querySelector(`.time-option[data-time="${plan.minutes}"]`);

    document.querySelectorAll(".time-option").forEach(option => option.classList.remove("active"));
    if (selectedOption) selectedOption.classList.add("active");
    if (detail) {
        detail.textContent = `今日情緒：${plan.recordedMood}。建議「${plan.treatmentName}」${plan.minutes} 分鐘，使用 ${plan.frequency}Hz；開始後會傳送療程指令給 ESP32。`;
    }
    if (reportText) {
        reportText.textContent = `本次建議：${plan.treatmentName}，${plan.minutes} 分鐘，${plan.frequency}Hz。療程依今日情緒日記選擇。`;
    }
    const reportTime = document.getElementById("report-total-time");
    const reportFrequency = document.getElementById("report-freq");
    if (reportTime) reportTime.textContent = `${plan.minutes} 分鐘`;
    if (reportFrequency) reportFrequency.textContent = `${plan.frequency} Hz`;
    return plan;
}

// 4. 彈窗與機器手臂控制
function initModalEvents() {
    const esp32Button = document.getElementById("esp32-connect-btn");
    if (esp32Button) esp32Button.addEventListener("click", connectESP32);

    const crisisOverlay = document.getElementById("crisis-overlay");
    const closeCrisisModal = () => crisisOverlay && crisisOverlay.classList.remove("show");
    const btnCloseCrisis = document.getElementById("btn-close-crisis");
    const btnDoneCrisis = document.getElementById("btn-done-crisis");
    if (btnCloseCrisis) btnCloseCrisis.addEventListener("click", closeCrisisModal);
    if (btnDoneCrisis) btnDoneCrisis.addEventListener("click", closeCrisisModal);
    if (crisisOverlay) crisisOverlay.addEventListener("click", event => {
        if (event.target === crisisOverlay) closeCrisisModal();
    });

    const dailyReportOverlay = document.getElementById("daily-report-overlay");
    const btnOpenDailyReport = document.getElementById("btn-open-daily-report");
    const btnCloseDailyReport = document.getElementById("btn-close-daily-report");
    const btnDoneDailyReport = document.getElementById("btn-done-daily-report");

    const toggleDailyReport = (show) => {
        if (!dailyReportOverlay) return;
        if (show) {
            const dateKey = formatDateKey(selectedDiaryDate);
            const data = mockDatabase[dateKey];

            document.getElementById("report-modal-date").textContent = `${dateKey} 情緒報表`;
            document.getElementById("report-modal-emoji").textContent = data ? data.emoji : "😶";
            document.getElementById("report-modal-mood").textContent = data
                ? String(data.moodText).replace(/\s*[（(][^）)]*[）)]\s*$/, "")
                : "無紀錄";
            document.getElementById("report-modal-text").textContent = data ? data.reportText : "當日尚無詳細數據。";

            dailyReportOverlay.classList.add("show");
        } else {
            dailyReportOverlay.classList.remove("show");
        }
    };

    if (btnOpenDailyReport) btnOpenDailyReport.addEventListener("click", () => toggleDailyReport(true));
    if (btnCloseDailyReport) btnCloseDailyReport.addEventListener("click", () => toggleDailyReport(false));
    if (btnDoneDailyReport) btnDoneDailyReport.addEventListener("click", () => toggleDailyReport(false));

    const robotOverlay = document.getElementById("robot-overlay");
    const btnOpenRobot = document.getElementById("btn-open-robot-modal");
    const btnCloseRobot = document.getElementById("btn-close-robot");

    if (btnOpenRobot && robotOverlay) btnOpenRobot.addEventListener("click", () => {
        updateTreatmentRecommendation();
        robotOverlay.classList.add("show");
    });
    if (btnCloseRobot && robotOverlay) btnCloseRobot.addEventListener("click", () => robotOverlay.classList.remove("show"));

    const timeOptions = document.querySelectorAll(".time-option");
    timeOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            timeOptions.forEach(t => t.classList.remove("active"));
            opt.classList.add("active");
            const reportTime = document.getElementById("report-total-time");
            if (reportTime) reportTime.textContent = `${Number(opt.dataset.time)} 分鐘`;
        });
    });

    const btnStart = document.getElementById("btn-start-treatment");
    const btnStop = document.getElementById("btn-stop-treatment");
    const statusText = document.getElementById("robot-status-text");

    if (btnStart && btnStop) {
        btnStart.addEventListener("click", async () => {
            if (!esp32Port) {
                alert("請先按上方「連接 ESP32」並選擇裝置。");
                return;
            }
            const selectedOption = document.querySelector(".time-option.active");
            const minutes = Number(selectedOption ? selectedOption.dataset.time : 5);
            const plan = getTodayTreatmentPlan();
            try {
                await writeToESP32(`START,${minutes},432`);
                const reportTime = document.getElementById("report-total-time");
                const reportFrequency = document.getElementById("report-freq");
                const reportText = document.getElementById("robot-report-text");
                if (reportTime) reportTime.textContent = `${minutes} 分鐘`;
                if (reportFrequency) reportFrequency.textContent = `${plan.frequency} Hz`;
                if (reportText) reportText.textContent = `已傳送療程指令給 ESP32：${plan.treatmentName}、${minutes} 分鐘、${plan.frequency}Hz。手臂動作由 ESP32 韌體執行。`;
                btnStart.style.display = "none";
                btnStop.style.display = "block";
                treatmentSecondsLeft = minutes * 60;
                const updateStatus = () => {
                    const mm = String(Math.floor(treatmentSecondsLeft / 60)).padStart(2, "0");
                    const ss = String(treatmentSecondsLeft % 60).padStart(2, "0");
                    if (statusText) statusText.textContent = `手臂狀態：療程進行中 (432Hz) ${mm}:${ss}`;
                    const bar = document.getElementById("status-bar");
                    if (bar) bar.textContent = `系統狀態：頌缽音療進行中，剩餘 ${mm}:${ss}`;
                    if (treatmentSecondsLeft <= 0) {
                        stopTreatmentTimer();
                        writeToESP32("STOP").catch(console.error);
                    }
                    treatmentSecondsLeft--;
                };
                updateStatus();
                treatmentTimer = setInterval(updateStatus, 1000);
            } catch (error) {
                alert(`無法啟動療程：${error.message}`);
            }
        });

        btnStop.addEventListener("click", async () => {
            try { await writeToESP32("STOP"); }
            catch (error) { alert(`停止指令傳送失敗：${error.message}`); }
            stopTreatmentTimer();
        });
    }

    const robotReportOverlay = document.getElementById("robot-report-overlay");
    const btnOpenRobotReport = document.getElementById("btn-open-robot-report");
    const btnCloseRobotReport = document.getElementById("btn-close-robot-report");
    const btnDoneRobotReport = document.getElementById("btn-done-robot-report");

    if (btnOpenRobotReport && robotReportOverlay) {
        btnOpenRobotReport.addEventListener("click", () => robotReportOverlay.classList.add("show"));
    }
    if (btnCloseRobotReport && robotReportOverlay) {
        btnCloseRobotReport.addEventListener("click", () => robotReportOverlay.classList.remove("show"));
    }
    if (btnDoneRobotReport && robotReportOverlay) {
        btnDoneRobotReport.addEventListener("click", () => robotReportOverlay.classList.remove("show"));
    }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
    initTabNavigation();
    initEmotionCanvas();
    renderWeekGrid();
    loadChatHistoryByDate(selectedDiaryDate);
    initWeekEvents();
    initModalEvents();
});
