/* =========================================================
   মোবাইলের নিচের মেনু বার: Home, Books, Wishlist, Stats
   (কম্পিউটারে দেখা যায় না, শুধু ছোট স্ক্রিনে)
========================================================= */

const appShell = document.getElementById("appShell");

if (appShell && typeof window.showPage === "function") {

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
        .bottom-bar { display: none; }

        @media (max-width: 768px) {
            /* উপরের মেনু লুকিয়ে নিচের মেনু দেখানো */
            .navbar { display: none !important; }

            #appShell { padding-bottom: 76px; }

            .bottom-bar {
                display: flex;
                position: fixed;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100;
                background: #fffaf3;
                border-top: 1px solid #e4d2bc;
                box-shadow: 0 -4px 16px rgba(77, 48, 25, .12);
                padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            .bottom-bar button {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: 9px 4px 8px;
                border: 0;
                background: transparent;
                color: #80644c;
                font: inherit;
                font-size: .72rem;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            .bottom-bar button .bb-icon {
                font-size: 1.35rem;
                line-height: 1;
                transition: transform .15s ease;
            }

            .bottom-bar button.active {
                color: #6b4228;
                font-weight: 700;
            }

            .bottom-bar button.active .bb-icon {
                transform: translateY(-2px) scale(1.12);
            }
        }
    `;
    document.head.appendChild(style);

    /* ---------- BAR ---------- */

    const tabs = [
        { page: "home", icon: "🏠", label: "Home" },
        { page: "books", icon: "📚", label: "Books" },
        { page: "wishlist", icon: "🛒", label: "Wishlist" },
        { page: "statistics", icon: "📊", label: "Stats" }
    ];

    const bar = document.createElement("nav");
    bar.className = "bottom-bar";
    bar.setAttribute("aria-label", "Main menu");

    bar.innerHTML = tabs.map(function (tab) {
        return `
            <button type="button" data-page="${tab.page}">
                <span class="bb-icon">${tab.icon}</span>
                <span>${tab.label}</span>
            </button>
        `;
    }).join("");

    appShell.appendChild(bar);

    const buttons = bar.querySelectorAll("button");

    function setActive(page) {
        buttons.forEach(function (button) {
            button.classList.toggle("active", button.dataset.page === page);
        });
    }

    /* ---------- showPage-এর সাথে জোড়া: যেকোনো উপায়ে পেজ বদলালে বার ঠিক থাকে ---------- */

    const previousShowPage = window.showPage;

    window.showPage = function (page) {
        previousShowPage(page);
        setActive(page);
    };

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            window.showPage(button.dataset.page);

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    setActive("home");
}