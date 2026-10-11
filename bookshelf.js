/* =========================================================
   📚 বইয়ের তাক: Home পেজের উপরে কাঠের তাকে সবার (বা শুধু নিজের) বইয়ের কভার সাজানো
   script.js-এর পরে লোড হয়। script.js বদলাতে হয় না।
========================================================= */

(function () {
    const homePage = document.getElementById("homePage");

    if (!homePage || typeof window.updateAll !== "function") return;

    const BOOK_W = 66;
    const GAP = 10;
    const PAD = 12;
    const MAX_ROWS = 3;

    const COLORS = ["#8e3b46", "#3d5a80", "#4f772d", "#b5651d",
                    "#6a4c93", "#2a7f7f", "#a23e48", "#5c6b73"];

    const STATUS_COLOR = {
        "Finished": "#2f9e5f",
        "Reading": "#e59a2f",
        "Want to Read": "#3d7be0"
    };

    let showAll = false;
    let shelfMode = "all";   /* "all" = সবার বই, "mine" = শুধু নিজের */
    let lastWidth = 0;

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
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
        .shelf-toggle { display: flex; gap: 6px; margin: 0 0 14px; flex-wrap: wrap; }
        .shelf-toggle { flex-wrap: nowrap; }
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

        .shelf-row {
            position: relative;
            display: flex;
            align-items: flex-end;
            gap: ${GAP}px;
            min-height: 118px;
            padding: 16px ${PAD}px 0;
            margin-bottom: 26px;
            background: linear-gradient(180deg, #f1e2cc, #e6d0b3);
            border-radius: 8px 8px 0 0;
            box-shadow: inset 0 10px 16px rgba(77, 48, 25, .22);
        }
        .shelf-row::after {
            content: "";
            position: absolute;
            left: -6px;
            right: -6px;
            bottom: -14px;
            height: 14px;
            background: linear-gradient(180deg, #b27a47, #7a4a26);
            border-radius: 3px;
            box-shadow: 0 7px 10px rgba(0, 0, 0, .28);
        }

        .shelf-book {
            position: relative;
            flex: 0 0 auto;
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

        .shelf-more {
            display: block;
            margin: 6px auto 0;
            padding: 8px 18px;
            border: 1px solid #d7c1a7;
            border-radius: 9px;
            background: #f5ebde;
            color: #593a25;
            cursor: pointer;
            font: inherit;
        }
        .shelf-empty {
            text-align: center;
            padding: 6px 0 2px;
            color: #80644c;
            font-size: .9rem;
        }
    `;
    style.textContent += `
        #homePage .hero { display: none !important; }
        #homePage > .recent-books-card:first-child { margin-top: 16px; }
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

    /* Home পেজের একদম উপরে বসানো (আগের "My Reading Journey" ছবির জায়গায়) */

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

    function bookHTML(book) {
        const h = hash(book.id);
        const height = 92 + (h % 15);
        const color = COLORS[h % COLORS.length];
        const dot = STATUS_COLOR[book.status] || "#999";

        const inner = book.cover
            ? `<img src="${esc(book.cover)}" alt="" loading="lazy">`
            : `<div class="shelf-fallback" style="background:${color}">${esc(book.name)}</div>`;

        const mineBook = typeof window.isMine === "function" ? window.isMine(book) : true;
        const label = book.name + (mineBook ? "" : " — " + (book.ownerName || "Reader"));

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
                <div class="shelf-row"></div>
                <p class="shelf-empty">${shelfMode === "mine" ? "Your shelf is empty. Add your first book! 📖" : "No books yet. Add the first one! 📖"}</p>
            `;
            return;
        }

        const width = body.clientWidth || section.clientWidth || 320;
        const perRow = Math.max(1, Math.floor((width - PAD * 2 + GAP) / (BOOK_W + GAP)));

        const rows = [];

        for (let i = 0; i < list.length; i += perRow) {
            rows.push(list.slice(i, i + perRow));
        }

        const visibleRows = showAll ? rows : rows.slice(0, MAX_ROWS);

        let html = visibleRows.map(function (row) {
            return `<div class="shelf-row">${row.map(bookHTML).join("")}</div>`;
        }).join("");

        if (rows.length > MAX_ROWS) {
            html += `
                <button type="button" class="shelf-more" id="shelfMore">
                    ${showAll ? "Show less ▴" : "Show all " + list.length + " books ▾"}
                </button>
            `;
        }

        body.innerHTML = html;
    }

    /* ---------- EVENTS ---------- */

    body.addEventListener("click", function (event) {
        const more = event.target.closest("#shelfMore");

        if (more) {
            showAll = !showAll;
            render();
            return;
        }

        const bookButton = event.target.closest(".shelf-book");

        if (bookButton && typeof window.openBookModal === "function") {
            window.openBookModal(Number(bookButton.dataset.id));
        }
    });

    section.querySelectorAll(".shelf-toggle button").forEach(function (button) {
        button.addEventListener("click", function () {
            shelfMode = button.dataset.mode;
            showAll = false;

            section.querySelectorAll(".shelf-toggle button").forEach(function (b) {
                b.classList.toggle("active", b === button);
            });

            render();
        });
    });

    /* স্ক্রিনের মাপ বদলালে (বা পেজ প্রথম দেখালে) সারি নতুন করে সাজানো */

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