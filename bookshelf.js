/* =========================================================
   📚 বইয়ের তাক: Home পেজের উপরে ক্যাটাগরি অনুযায়ী আলাদা আলাদা কাঠের তাক
   (থ্রিলার / হরর / সামাজিক + রোমান্টিক / বাকি সব)
   script.js-এর পরে লোড হয়। script.js বদলাতে হয় না।
========================================================= */

(function () {
    const homePage = document.getElementById("homePage");

    if (!homePage || typeof window.updateAll !== "function") return;

    /* ---------------------------------------------------------
       তাকের ক্যাটাগরি। বইয়ের Genre-এ নিচের কোনো শব্দ থাকলে বইটা ওই তাকে যায়।
       নতুন শব্দ বা নতুন তাক যোগ করতে এই তালিকা বদলান।
       ওপর থেকে নিচে যেটা আগে মিলবে, বইটা সেই তাকে যাবে।
    --------------------------------------------------------- */

    const CATEGORIES = [
        {
            name: "Thriller",
            icon: "🔪",
            match: ["থ্রিলার", "thriller", "মিস্ট্রি", "mystery", "রহস্য",
                    "crime", "ক্রাইম", "গোয়েন্দা", "detective", "সাসপেন্স",
                    "suspense", "অ্যাকশন", "action"]
        },
        {
            name: "Horror",
            icon: "👻",
            match: ["হরর", "horror", "ভৌতিক", "ভূত", "ghost",
                    "অতিপ্রাকৃত", "supernatural"]
        },
        {
            name: "Social + Romantic",
            icon: "💞",
            match: ["সামাজিক", "social", "রোমান্টিক", "romantic", "romance",
                    "প্রেম", "love"]
        }
    ];

    const OTHERS = { name: "Others", icon: "📚" };

    const BOOK_W = 66;
    const GAP = 10;
    const PAD = 12;

    const COLORS = ["#8e3b46", "#3d5a80", "#4f772d", "#b5651d",
                    "#6a4c93", "#2a7f7f", "#a23e48", "#5c6b73"];

    const STATUS_COLOR = {
        "Finished": "#2f9e5f",
        "Reading": "#e59a2f",
        "Want to Read": "#3d7be0"
    };

    let shelfMode = "all";   /* "all" = সবার বই, "mine" = শুধু নিজের */
    let lastWidth = 0;

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
        #homePage .hero { display: none !important; }
        #homePage > .recent-books-card:first-child { margin-top: 16px; }

        .shelf-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }
        .shelf-head h3 { margin: 0; }
        .shelf-count { color: #80644c; font-size: .9rem; }

        .shelf-toggle { display: flex; gap: 6px; margin: 0 0 18px; flex-wrap: nowrap; }
        .shelf-toggle button {
            white-space: nowrap;
            padding: 6px 11px;
            border: 1px solid #d7c1a7;
            border-radius: 20px;
            background: #f5ebde;
            color: #593a25;
            cursor: pointer;
            font: inherit;
            font-size: .8rem;
        }
        .shelf-toggle button.active {
            background: #6b4228;
            border-color: #6b4228;
            color: #fff;
        }

        /* একেকটা ক্যাটাগরির তাক */
        .shelf-section { margin-bottom: 30px; }

        .shelf-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin: 0 0 8px;
        }
        .shelf-label strong {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 5px 13px;
            background: #6b4228;
            color: #fff;
            border-radius: 20px;
            font-size: .82rem;
        }
        .shelf-label strong em {
            font-style: normal;
            font-weight: 600;
            opacity: .75;
        }
        .shelf-label span {
            font-size: .75rem;
            color: #a38566;
        }

        .shelf-scroll {
            display: flex;
            align-items: flex-end;
            gap: ${GAP}px;
            min-height: 118px;
            padding: 16px ${PAD}px 0;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            background: linear-gradient(180deg, #f1e2cc, #e6d0b3);
            border-radius: 8px 8px 0 0;
            box-shadow: inset 0 10px 16px rgba(77, 48, 25, .22);
        }
        .shelf-scroll::after {
            content: "";
            flex: 0 0 2px;
        }
        .shelf-board {
            height: 14px;
            margin: 0 -6px;
            background: linear-gradient(180deg, #b27a47, #7a4a26);
            border-radius: 3px;
            box-shadow: 0 7px 10px rgba(0, 0, 0, .28);
        }

        .shelf-book {
            position: relative;
            flex: 0 0 ${BOOK_W}px;
            width: ${BOOK_W}px;
            padding: 0;
            border: 0;
            border-radius: 3px 5px 5px 3px;
            overflow: hidden;
            cursor: pointer;
            background: #ccc;
            box-shadow: -3px 3px 7px rgba(0, 0, 0, .35);
            transition: transform .2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        .shelf-book:hover { transform: translateY(-7px); }
        .shelf-book:active { transform: translateY(-3px); }

        .shelf-book::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 6px;
            background: linear-gradient(90deg, rgba(0,0,0,.28), rgba(255,255,255,.22), transparent);
            z-index: 2;
            pointer-events: none;
        }
        .shelf-book img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .shelf-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 5px 8px 9px;
            box-sizing: border-box;
            text-align: center;
            color: #fff;
            font-size: .68rem;
            font-weight: 700;
            line-height: 1.2;
            overflow: hidden;
            word-break: break-word;
        }
        .shelf-dot {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 12px;
            height: 12px;
            border: 2px solid #fff;
            border-radius: 50%;
            z-index: 3;
            box-shadow: 0 1px 3px rgba(0,0,0,.4);
        }

        .shelf-legend {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
            margin-top: 6px;
            font-size: .8rem;
            color: #80644c;
        }
        .shelf-legend span::before {
            content: "";
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-right: 5px;
            border-radius: 50%;
            background: var(--c);
        }
        .shelf-empty {
            text-align: center;
            padding: 6px 0 14px;
            color: #80644c;
            font-size: .9rem;
        }
    `;
    document.head.appendChild(style);

    /* ---------- SECTION ---------- */

    const section = document.createElement("section");
    section.className = "recent-books-card";
    section.innerHTML = `
        <div class="shelf-head">
            <h3>📚 Bookshelf</h3>
            <span class="shelf-count" id="shelfCount"></span>
        </div>
        <div class="shelf-toggle">
            <button type="button" class="active" data-mode="all">👥 Everyone's Books</button>
            <button type="button" data-mode="mine">🙋 My Books</button>
        </div>
        <div id="shelfBody"></div>
        <div class="shelf-legend">
            <span style="--c:#2f9e5f">Finished</span>
            <span style="--c:#e59a2f">Reading</span>
            <span style="--c:#3d7be0">Want to Read</span>
        </div>
    `;

    /* Home পেজের একদম উপরে বসানো */

    homePage.insertBefore(section, homePage.firstChild);

    const body = document.getElementById("shelfBody");
    const countEl = document.getElementById("shelfCount");

    /* ---------- HELPERS ---------- */

    function esc(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function hash(id) {
        return Math.abs(parseInt(id, 10) || 0);
    }

    /* বইটা কোন তাকে যাবে (Genre দেখে) */

    function categoryOf(book) {
        const genre = String(book.genre || "").toLowerCase();

        for (const category of CATEGORIES) {
            for (const word of category.match) {
                if (genre.includes(word.toLowerCase())) {
                    return category.name;
                }
            }
        }

        return OTHERS.name;
    }

    function bookHTML(book) {
        const h = hash(book.id);
        const height = 92 + (h % 15);
        const color = COLORS[h % COLORS.length];
        const dot = STATUS_COLOR[book.status] || "#999";

        const mineBook = typeof window.isMine === "function" ? window.isMine(book) : true;
        const label = book.name + (mineBook ? "" : " — " + (book.ownerName || "Reader"));

        const inner = book.cover
            ? `<img src="${esc(book.cover)}" alt="" loading="lazy">`
            : `<div class="shelf-fallback" style="background:${color}">${esc(book.name)}</div>`;

        return `
            <button type="button" class="shelf-book" data-id="${esc(book.id)}"
                    title="${esc(label)}" style="height:${height}px">
                ${inner}
                <span class="shelf-dot" style="background:${dot}"></span>
            </button>
        `;
    }

    /* ---------- RENDER ---------- */

    function render() {
        let source = [];

        if (shelfMode === "mine") {
            source = typeof window.myBooks === "function" ? window.myBooks() : [];
        } else {
            source = typeof books !== "undefined" ? books : [];
        }

        const list = source.slice().sort(function (a, b) {
            return (b.addedAt || b.id) - (a.addedAt || a.id);
        });

        countEl.textContent = list.length
            ? list.length + " book" + (list.length === 1 ? "" : "s")
            : "";

        if (list.length === 0) {
            body.innerHTML = `
                <div class="shelf-section">
                    <div class="shelf-scroll"></div>
                    <div class="shelf-board"></div>
                </div>
                <p class="shelf-empty">${shelfMode === "mine"
                    ? "Your shelf is empty. Add your first book! 📖"
                    : "No books yet. Add the first one! 📖"}</p>
            `;
            return;
        }

        /* বইগুলো ক্যাটাগরি অনুযায়ী ভাগ করা */

        const groups = {};

        list.forEach(function (book) {
            const key = categoryOf(book);

            if (!groups[key]) groups[key] = [];

            groups[key].push(book);
        });

        const order = CATEGORIES.concat([OTHERS]);

        const width = body.clientWidth || section.clientWidth || 320;
        const perRow = Math.max(1, Math.floor((width - PAD * 2 + GAP) / (BOOK_W + GAP)));

        body.innerHTML = order
            .filter(function (category) {
                return groups[category.name] && groups[category.name].length;
            })
            .map(function (category) {
                const items = groups[category.name];
                const hint = items.length > perRow ? "swipe ›" : "";

                return `
                    <div class="shelf-section">
                        <div class="shelf-label">
                            <strong>${category.icon} ${esc(category.name)} <em>${items.length}</em></strong>
                            <span>${hint}</span>
                        </div>
                        <div class="shelf-scroll">${items.map(bookHTML).join("")}</div>
                        <div class="shelf-board"></div>
                    </div>
                `;
            })
            .join("");
    }

    /* ---------- EVENTS ---------- */

    body.addEventListener("click", function (event) {
        const bookButton = event.target.closest(".shelf-book");

        if (bookButton && typeof window.openBookModal === "function") {
            window.openBookModal(Number(bookButton.dataset.id));
        }
    });

    section.querySelectorAll(".shelf-toggle button").forEach(function (button) {
        button.addEventListener("click", function () {
            shelfMode = button.dataset.mode;

            section.querySelectorAll(".shelf-toggle button").forEach(function (b) {
                b.classList.toggle("active", b === button);
            });

            render();
        });
    });

    /* স্ক্রিনের মাপ বদলালে (বা পেজ প্রথম দেখালে) নতুন করে আঁকা */

    if ("ResizeObserver" in window) {
        new ResizeObserver(function () {
            const width = body.clientWidth;

            if (width > 0 && width !== lastWidth) {
                lastWidth = width;
                render();
            }
        }).observe(body);
    }

    /* বই বদলালেই তাক নতুন করে আঁকা */

    const originalUpdateAll = window.updateAll;

    window.updateAll = function () {
        originalUpdateAll();
        render();
    };

    render();
})();