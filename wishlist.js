import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore, doc, collection, setDoc, deleteDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDefA42IiAb3jLNNK_UOyNuOJNI4DhaJ7E",
    authDomain: "mybooktracker-67b4a.firebaseapp.com",
    projectId: "mybooktracker-67b4a",
    storageBucket: "mybooktracker-67b4a.firebasestorage.app",
    messagingSenderId: "137800897044",
    appId: "1:137800897044:web:7b1d67187f9aa6e9da8d01",
    measurementId: "G-HNZ32N5Q6L"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let uid = null;
let unsubscribe = null;
let items = [];


/* ================= STYLE ================= */

const style = document.createElement("style");
style.textContent = `
    .wl-summary {
        margin: 18px auto;
        max-width: 900px;
        padding: 0 16px;
        font-weight: 600;
        color: #6b4228;
    }
    .wl-list {
        max-width: 900px;
        margin: 0 auto 40px;
        padding: 0 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .wl-heading {
        margin: 14px 0 0;
        color: #80644c;
        font-size: 1rem;
    }
    .wl-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        padding: 16px 18px;
        background: #fffaf3;
        border: 1px solid #e4d2bc;
        border-radius: 14px;
        box-shadow: 0 4px 14px rgba(77, 48, 25, .08);
        color: #4b3020;
    }
    .wl-item h3 { margin: 0 0 4px; font-size: 1.1rem; }
    .wl-item p { margin: 2px 0; color: #80644c; font-size: .92rem; overflow-wrap: anywhere; }
    .wl-main { flex: 1 1 220px; min-width: 0; }
    .wl-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .wl-actions button {
        padding: 9px 13px;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
        font-weight: 600;
    }
    .wl-buy-btn { background: #2f7d4f; color: #fff; }
    .wl-undo-btn { background: #e6d2b7; color: #593a25; }
    .wl-remove-btn { background: #b83a3a; color: #fff; }
    .wl-bought { opacity: .65; }
    .wl-bought h3 { text-decoration: line-through; }
    .wl-empty { text-align: center; padding: 30px 10px; color: #80644c; }
    #wlForm textarea { min-height: 70px; }
`;
document.head.appendChild(style);


/* ================= NAV LINK + PAGE ================= */

const navbar = document.querySelector(".navbar");
const statisticsPage = document.getElementById("statisticsPage");

const wishlistLink = document.createElement("a");
wishlistLink.href = "#";
wishlistLink.id = "wishlistLink";
wishlistLink.className = "nav-link";
wishlistLink.textContent = "Wishlist";
navbar.appendChild(wishlistLink);

const wishlistPage = document.createElement("main");
wishlistPage.id = "wishlistPage";
wishlistPage.className = "hidden";
wishlistPage.innerHTML = `
    <section class="page-title">
        <h1>🛒 My Wishlist</h1>
        <p>Books you want to buy. Only you can see this list.</p>
    </section>

    <section class="form-card">
        <h2>➕ Add to Wishlist</h2>

        <form id="wlForm">
            <div class="form-group">
                <label for="wlTitle">Book Name</label>
                <input type="text" id="wlTitle" placeholder="Enter book name" required maxlength="150">
            </div>

            <div class="form-group">
                <label for="wlAuthor">Author (optional)</label>
                <input type="text" id="wlAuthor" placeholder="Enter author name" maxlength="100">
            </div>

            <div class="form-group">
                <label for="wlPrice">Price (optional)</label>
                <input type="number" id="wlPrice" placeholder="e.g. 350" min="0" step="any">
            </div>

            <div class="form-group">
                <label for="wlNote">Note (optional)</label>
                <textarea id="wlNote" rows="3" placeholder="Where to buy, edition, why you want it..." maxlength="300"></textarea>
            </div>

            <button type="submit" id="wlAddBtn">➕ Add to Wishlist</button>
        </form>
    </section>

    <section id="wlSummary" class="wl-summary"></section>
    <section id="wlList" class="wl-list"></section>
`;
statisticsPage.insertAdjacentElement("afterend", wishlistPage);

const wlForm = document.getElementById("wlForm");
const wlList = document.getElementById("wlList");
const wlSummary = document.getElementById("wlSummary");


/* ================= SHOW PAGE (script.js-এর showPage-এর সাথে জোড়া) ================= */

const originalShowPage = window.showPage;

window.showPage = function (page) {
    wishlistPage.classList.add("hidden");
    wishlistLink.classList.remove("active");

    if (page === "wishlist") {
        originalShowPage("__none__");

        wishlistPage.classList.remove("hidden");
        wishlistLink.classList.add("active");
    } else {
        originalShowPage(page);
    }
};

wishlistLink.addEventListener("click", function (event) {
    event.preventDefault();
    window.showPage("wishlist");
});


/* ================= HELPERS ================= */

function escapeHTML(text) {
    if (text === null || text === undefined) return "";

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function itemCard(item) {
    const priceHTML = item.price !== "" && item.price !== null && item.price !== undefined
        ? `<p>💰 ${escapeHTML(item.price)}</p>` : "";
    const authorHTML = item.author ? `<p>✍️ ${escapeHTML(item.author)}</p>` : "";
    const noteHTML = item.note ? `<p>📝 ${escapeHTML(item.note)}</p>` : "";

    return `
        <div class="wl-item ${item.bought ? "wl-bought" : ""}" data-id="${escapeHTML(item.id)}">
            <div class="wl-main">
                <h3>${escapeHTML(item.title)}</h3>
                ${authorHTML}
                ${priceHTML}
                ${noteHTML}
            </div>
            <div class="wl-actions">
                <button class="${item.bought ? "wl-undo-btn" : "wl-buy-btn"}" data-action="toggle">
                    ${item.bought ? "↩️ Undo" : "✅ Bought"}
                </button>
                <button class="wl-remove-btn" data-action="remove">🗑️ Remove</button>
            </div>
        </div>
    `;
}

function render() {
    const pending = items.filter(i => !i.bought)
        .sort((a, b) => b.addedAt - a.addedAt);
    const bought = items.filter(i => i.bought)
        .sort((a, b) => b.addedAt - a.addedAt);

    const total = pending.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

    wlSummary.textContent = items.length === 0
        ? ""
        : `🛒 ${pending.length} to buy` +
          (total > 0 ? ` • Estimated total: ${total.toLocaleString()}` : "") +
          (bought.length ? ` • ✅ ${bought.length} bought` : "");

    if (items.length === 0) {
        wlList.innerHTML = `
            <div class="wl-empty">
                <h3>🛒 Your wishlist is empty</h3>
                <p>Add the books you want to buy.</p>
            </div>
        `;
        return;
    }

    let html = pending.map(itemCard).join("");

    if (bought.length) {
        html += `<h3 class="wl-heading">✅ Bought</h3>` + bought.map(itemCard).join("");
    }

    wlList.innerHTML = html;
}


/* ================= ADD / TOGGLE / REMOVE ================= */

wlForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!uid) {
        alert("Please log in first.");
        return;
    }

    const title = document.getElementById("wlTitle").value.trim();

    if (!title) return;

    const priceRaw = document.getElementById("wlPrice").value;
    const id = String(Date.now());

    const item = {
        id: id,
        title: title,
        author: document.getElementById("wlAuthor").value.trim(),
        price: priceRaw === "" ? "" : Number(priceRaw),
        note: document.getElementById("wlNote").value.trim(),
        bought: false,
        addedAt: Date.now()
    };

    try {
        await setDoc(doc(db, "users", uid, "wishlist", id), item);
        wlForm.reset();
    } catch (error) {
        console.error(error);
        alert("Could not save: " + error.message);
    }
});

wlList.addEventListener("click", async function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button || !uid) return;

    const card = button.closest(".wl-item");
    const id = card.dataset.id;
    const item = items.find(i => i.id === id);

    if (!item) return;

    try {
        if (button.dataset.action === "toggle") {
            await updateDoc(doc(db, "users", uid, "wishlist", id), {
                bought: !item.bought
            });
        } else if (button.dataset.action === "remove") {
            if (confirm(`Remove "${item.title}" from your wishlist?`)) {
                await deleteDoc(doc(db, "users", uid, "wishlist", id));
            }
        }
    } catch (error) {
        console.error(error);
        alert("Something went wrong: " + error.message);
    }
});


/* ================= LOAD (শুধু নিজের wishlist) ================= */

onAuthStateChanged(auth, function (user) {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    if (!user) {
        uid = null;
        items = [];
        render();
        return;
    }

    uid = user.uid;
    const myUid = user.uid;

    unsubscribe = onSnapshot(
        collection(db, "users", myUid, "wishlist"),
        function (snap) {
            if (uid !== myUid) return;

            items = snap.docs.map(d => d.data());
            render();
        },
        function (error) {
            console.error(error);
        }
    );
});

render();