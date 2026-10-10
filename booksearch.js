/* =========================================================
   বই খুঁজে নিজে থেকে তথ্য ও কভার ভরা (Google Books ফ্রি সার্ভিস)
   script.js-এর পরে লোড হয়। script.js বদলাতে হয় না।
========================================================= */

(function () {
    const nameField = document.getElementById("bookName");
    const authorField = document.getElementById("author");
    const genreField = document.getElementById("genre");

    if (!nameField || !authorField || !genreField) return;

    let pendingCover = "";
    let timer = null;
    let requestId = 0;

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
        .bs-row { display: flex; gap: 8px; }
        .bs-row input { flex: 1; min-width: 0; }
        .bs-row button {
            padding: 0 16px;
            border: 0;
            border-radius: 9px;
            background: #6b4228;
            color: #fff;
            cursor: pointer;
            font: inherit;
            font-weight: 600;
            white-space: nowrap;
        }
        .bs-hint { margin: 6px 0 0; font-size: .85rem; color: #80644c; }
        .bs-results { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .bs-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            text-align: left;
            background: #fffaf3;
            border: 1px solid #e4d2bc;
            border-radius: 10px;
            cursor: pointer;
            font: inherit;
            color: #4b3020;
        }
        .bs-item:hover { background: #f5ebde; }
        .bs-item img, .bs-noimg {
            width: 44px;
            height: 64px;
            object-fit: cover;
            border-radius: 5px;
            flex-shrink: 0;
            background: #ead7c0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bs-item strong { display: block; }
        .bs-item span { font-size: .88rem; color: #80644c; }
        .bs-preview {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            font-size: .9rem;
            color: #276749;
        }
        .bs-preview img { width: 44px; height: 64px; object-fit: cover; border-radius: 5px; }
        .bs-preview button {
            border: 0;
            background: none;
            color: #a12626;
            cursor: pointer;
            font: inherit;
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);

    /* ---------- UI ---------- */

    const box = document.createElement("div");
    box.className = "form-group";
    box.innerHTML = `
        <label for="bsInput">🔎 Search book online (optional)</label>
        <div class="bs-row">
            <input type="text" id="bsInput" placeholder="Type a book name to auto-fill details..." autocomplete="off">
            <button type="button" id="bsBtn">Search</button>
        </div>
        <p class="bs-hint" id="bsHint">Pick a result and the name, author, genre and cover are filled in for you.</p>
        <div class="bs-results" id="bsResults"></div>
        <div class="bs-preview" id="bsPreview" style="display:none;"></div>
    `;

    const firstGroup = nameField.closest(".form-group");
    firstGroup.parentNode.insertBefore(box, firstGroup);

    const input = document.getElementById("bsInput");
    const btn = document.getElementById("bsBtn");
    const hint = document.getElementById("bsHint");
    const results = document.getElementById("bsResults");
    const preview = document.getElementById("bsPreview");

    function esc(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /* ---------- SEARCH ---------- */

    function coverOf(info) {
        const links = info.imageLinks || {};
        let url = links.thumbnail || links.smallThumbnail || "";

        if (!url) return "";

        url = url.replace(/^http:\/\//, "https://").replace("&edge=curl", "");

        return url;
    }

    async function search() {
        const q = input.value.trim();

        if (q.length < 2) {
            results.innerHTML = "";
            hint.textContent = "Type at least 2 letters.";
            return;
        }

        const myRequest = ++requestId;
        hint.textContent = "Searching...";
        results.innerHTML = "";

        try {
            const url =
                "https://www.googleapis.com/books/v1/volumes?printType=books&maxResults=6&q=" +
                encodeURIComponent(q);

            const response = await fetch(url);

            if (!response.ok) throw new Error("HTTP " + response.status);

            const data = await response.json();

            if (myRequest !== requestId) return;

            const items = data.items || [];

            if (items.length === 0) {
                hint.textContent = "No books found. You can type the details by hand below.";
                return;
            }

            hint.textContent = "Tap a result to fill the form:";

            results.innerHTML = items.map(function (item, index) {
                const info = item.volumeInfo || {};
                const cover = coverOf(info);
                const authors = (info.authors || []).join(", ") || "Unknown author";

                return `
                    <button type="button" class="bs-item" data-index="${index}">
                        ${cover
                            ? `<img src="${esc(cover)}" alt="">`
                            : `<div class="bs-noimg">📖</div>`}
                        <div>
                            <strong>${esc(info.title || "Untitled")}</strong>
                            <span>${esc(authors)}</span>
                        </div>
                    </button>
                `;
            }).join("");

            results._items = items;
        } catch (error) {
            console.error(error);

            if (myRequest === requestId) {
                hint.textContent =
                    "Search is not working right now. You can type the details by hand below.";
            }
        }
    }

    /* ---------- PICK A RESULT ---------- */

    results.addEventListener("click", function (event) {
        const button = event.target.closest(".bs-item");

        if (!button || !results._items) return;

        const item = results._items[Number(button.dataset.index)];
        const info = (item && item.volumeInfo) || {};

        nameField.value = info.title || "";
        authorField.value = (info.authors || []).join(", ");

        if (info.categories && info.categories.length) {
            genreField.value = info.categories[0];
        }

        pendingCover = coverOf(info);

        results.innerHTML = "";
        results._items = null;
        hint.textContent = "✅ Details filled. Check them, then press Add Book.";

        showPreview();
    });

    function showPreview() {
        if (!pendingCover) {
            preview.style.display = "none";
            preview.innerHTML = "";
            return;
        }

        preview.style.display = "flex";
        preview.innerHTML = `
            <img src="${esc(pendingCover)}" alt="Cover">
            <span>Cover will be added</span>
            <button type="button" id="bsRemoveCover">Remove</button>
        `;

        document.getElementById("bsRemoveCover").addEventListener("click", function () {
            pendingCover = "";
            showPreview();
        });
    }

    function clearSearch() {
        pendingCover = "";
        input.value = "";
        results.innerHTML = "";
        results._items = null;
        hint.textContent =
            "Pick a result and the name, author, genre and cover are filled in for you.";
        showPreview();
    }

    /* ---------- EVENTS ---------- */

    btn.addEventListener("click", search);

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            search();
        }
    });

    input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(search, 700);
    });

    /* ---------- script.js-এর সাথে জোড়া ---------- */

    const originalCreate = window.createNewBook;
    const originalReset = window.resetForm;
    const originalEdit = window.editBook;

    /* নতুন বই: ছবি ফাইল না দিলে খুঁজে পাওয়া কভার বসবে */
    window.createNewBook = function (coverImage) {
        originalCreate(coverImage || pendingCover);
    };

    window.resetForm = function () {
        originalReset();
        clearSearch();
    };

    /* Edit করার সময় খোঁজা কভার যেন ভুল বইয়ে না লাগে */
    window.editBook = function (id) {
        pendingCover = "";
        showPreview();
        originalEdit(id);
    };
})();