/* =========================================================
   মাসে কয়টা বই শেষ করলেন: Statistics পেজে মাসিক গ্রাফ
========================================================= */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore, collection, query, where, onSnapshot, updateDoc
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let unsubscribe = null;
let books = [];
let statusMap = null;
let selectedYear = new Date().getFullYear();


/* ================= STYLE ================= */

const style = document.createElement("style");
style.textContent = `
    .mc-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    .mc-top select {
        padding: 8px 12px;
        border: 1px solid #d8c5ae;
        border-radius: 8px;
        background: #fff;
        color: #382719;
        font: inherit;
    }
    .mc-total { margin: 8px 0 14px; color: #80644c; font-weight: 600; }
    .mc-chart {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 190px;
        padding-top: 10px;
    }
    .mc-col {
        flex: 1;
        min-width: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
    }
    .mc-count { font-size: .85rem; font-weight: 700; color: #4b3020; margin-bottom: 3px; }
    .mc-bar {
        width: 100%;
        max-width: 34px;
        background: linear-gradient(180deg, #8a5a38, #6b4228);
        border-radius: 6px 6px 0 0;
        transition: height .5s ease;
    }
    .mc-bar.mc-zero { background: #e6d2b7; }
    .mc-month { margin-top: 6px; font-size: .75rem; color: #80644c; }
    @media (max-width: 520px) {
        .mc-chart { gap: 3px; }
        .mc-month { font-size: .65rem; }
    }
`;
document.head.appendChild(style);


/* ================= PAGE SECTION ================= */

const statisticsPage = document.getElementById("statisticsPage");
const genreCard = statisticsPage.querySelector(".genre-card");

const section = document.createElement("section");
section.className = "genre-card";
section.innerHTML = `
    <div class="mc-top">
        <h2>📅 Books Finished per Month</h2>
        <select id="mcYear" aria-label="Year"></select>
    </div>
    <p class="mc-total" id="mcTotal"></p>
    <div class="mc-chart" id="mcChart"></div>
`;

if (genreCard) {
    genreCard.insertAdjacentElement("afterend", section);
} else {
    statisticsPage.appendChild(section);
}

const yearSelect = document.getElementById("mcYear");
const totalEl = document.getElementById("mcTotal");
const chartEl = document.getElementById("mcChart");

yearSelect.addEventListener("change", function () {
    selectedYear = Number(yearSelect.value);
    render();
});


/* ================= RENDER ================= */

function finishedDate(book) {
    return new Date(book.finishedAt || book.addedAt || book.id);
}

function render() {
    const finished = books.filter(b => b.status === "Finished");

    /* বছরের তালিকা */

    const years = new Set([new Date().getFullYear(), selectedYear]);

    finished.forEach(b => years.add(finishedDate(b).getFullYear()));

    const sortedYears = [...years].sort((a, b) => b - a);

    yearSelect.innerHTML = sortedYears
        .map(y => `<option value="${y}" ${y === selectedYear ? "selected" : ""}>${y}</option>`)
        .join("");

    /* মাস অনুযায়ী গণনা */

    const counts = new Array(12).fill(0);

    finished.forEach(b => {
        const d = finishedDate(b);

        if (d.getFullYear() === selectedYear) {
            counts[d.getMonth()]++;
        }
    });

    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(...counts, 1);

    totalEl.textContent = total === 0
        ? `No finished books in ${selectedYear} yet.`
        : `📚 ${total} book${total === 1 ? "" : "s"} finished in ${selectedYear}`;

    chartEl.innerHTML = counts.map((count, i) => {
        const height = count === 0 ? 4 : Math.max(10, Math.round((count / max) * 140));

        return `
            <div class="mc-col">
                <div class="mc-count">${count || ""}</div>
                <div class="mc-bar ${count === 0 ? "mc-zero" : ""}" style="height:${height}px"></div>
                <div class="mc-month">${MONTHS[i]}</div>
            </div>
        `;
    }).join("");
}


/* ================= DATA ================= */

onAuthStateChanged(auth, function (user) {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    books = [];
    statusMap = null;
    selectedYear = new Date().getFullYear();
    render();

    if (!user) return;

    const myUid = user.uid;

    unsubscribe = onSnapshot(
        query(collection(db, "sharedBooks"), where("ownerId", "==", myUid)),
        function (snap) {
            books = snap.docs.map(d => d.data());

            /* বই "Finished" হলে তখনকার তারিখ জমা রাখি (প্রথমবার লোডে নয়) */

            if (statusMap) {
                snap.docChanges().forEach(function (change) {
                    const book = change.doc.data();
                    const before = statusMap.get(book.id);

                    const justFinished =
                        book.status === "Finished" &&
                        !book.finishedAt &&
                        (change.type === "added" ||
                         (change.type === "modified" && before !== "Finished"));

                    if (justFinished) {
                        updateDoc(change.doc.ref, { finishedAt: Date.now() })
                            .catch(function (error) { console.error(error); });
                    }
                });
            }

            statusMap = new Map(books.map(b => [b.id, b.status]));

            render();
        },
        function (error) {
            console.error(error);
        }
    );
});

render();