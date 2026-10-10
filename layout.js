/* =========================================================
   নতুন সাজানো:
   - Statistics পেজের কার্ডে চাপলে (Total / Finished / Reading / Want to Read)
     সেই পেজেই নিচে ওই বইগুলো দেখায়
   - Books পেজে শুধু নতুন বই যোগ করার ফর্ম থাকে
   script.js-এর পরে লোড হয়। script.js বদলাতে হয় না।
========================================================= */

(function () {
    const statsPage = document.getElementById("statisticsPage");
    const booksPage = document.getElementById("booksPage");
    const grid = statsPage && statsPage.querySelector(".statistics-grid");
    const shelf = document.getElementById("bookshelf");
    const searchBox = document.querySelector(".search-sort");

    if (!statsPage || !booksPage || !grid || !shelf || !searchBox) return;

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
        #statsBooksPanel { margin-top: 30px; }
        .sbp-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
        }
        .sbp-head h2 { margin: 0; color: #4b3020; }
        #sbpClose {
            padding: 8px 14px;
            border: 1px solid #d7c1a7;
            border-radius: 9px;
            background: #f5ebde;
            color: #593a25;
            cursor: pointer;
            font: inherit;
        }
    `;
    document.head.appendChild(style);

    /* ---------- বইয়ের তালিকার জায়গা (Statistics পেজে) ---------- */

    const panel = document.createElement("section");
    panel.id = "statsBooksPanel";
    panel.className = "hidden";
    panel.innerHTML = `
        <div class="sbp-head">
            <h2 id="sbpTitle">📚 All My Books</h2>
            <button type="button" id="sbpClose">✕ Hide</button>
        </div>
        <div id="sbpBody"></div>
    `;
    grid.insertAdjacentElement("afterend", panel);

    const body = document.getElementById("sbpBody");
    const title = document.getElementById("sbpTitle");

    /* Books পেজ থেকে তালিকা, সার্চ, ফিল্টার সরিয়ে আনা */

    document.querySelectorAll(".filters").forEach(function (el) {
        body.appendChild(el);
    });

    body.appendChild(searchBox);
    body.appendChild(shelf);

    /* Books পেজের লেখা ঠিক করা */

    const pageSubtitle = booksPage.querySelector(".page-title p");

    if (pageSubtitle) {
        pageSubtitle.textContent = "Add a new book to your collection.";
    }

    /* ---------- শিরোনাম ---------- */

    const titles = {
        "All": "📚 All My Books",
        "Finished": "✅ Finished Books",
        "Reading": "📖 Currently Reading",
        "Want to Read": "📌 Want to Read"
    };

    function setTitle(filter) {
        title.textContent = titles[filter] || titles["All"];
    }

    document.querySelectorAll(".filter-btn[data-filter]").forEach(function (button) {
        button.addEventListener("click", function () {
            setTitle(button.dataset.filter);
        });
    });

    /* ---------- কার্ডে চাপলে ---------- */

    function openPanel(filter) {
        if (typeof setViewMode === "function") {
            setViewMode("mine");
        }

        const search = document.getElementById("bookSearch");

        if (search) search.value = "";

        const button = document.querySelector(
            '.filter-btn[data-filter="' + filter + '"]'
        );

        if (button) button.click();

        setTitle(filter);

        panel.classList.remove("hidden");

        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleCard(event) {
        const card = event.target.closest(".statistics-card");

        if (!card) return;

        if (
            event.type === "keydown" &&
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        /* script.js-এর আগের "Books পেজে নিয়ে যাওয়া" আটকে দেওয়া */

        event.stopPropagation();
        event.preventDefault();

        openPanel(card.dataset.statusFilter || "All");
    }

    statsPage.addEventListener("click", handleCard, true);
    statsPage.addEventListener("keydown", handleCard, true);

    document.getElementById("sbpClose").addEventListener("click", function () {
        panel.classList.add("hidden");
    });
})();