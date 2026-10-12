/* =========================================================
   📸 Photos: সবাই বইয়ের ছবি আপলোড করে, নাম ও তারিখ দেখা যায়, লাইক দেওয়া যায়
   bottombar.js-এর পরে লোড হয়।
========================================================= */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore, collection, doc, setDoc, deleteDoc, updateDoc,
    onSnapshot, query, orderBy, limit, arrayUnion, arrayRemove
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

const statisticsPage = document.getElementById("statisticsPage");
const navbar = document.querySelector(".navbar");

if (statisticsPage && typeof window.showPage === "function") {

    const PAGE_SIZE = 20;

    let uid = null;
    let photos = [];
    let maxPhotos = PAGE_SIZE;
    let unsubscribe = null;
    let pendingImage = "";

    /* ---------- STYLE ---------- */

    const style = document.createElement("style");
    style.textContent = `
        .ph-wrap { max-width: 560px; margin: 0 auto; padding: 0 16px 40px; }

        .ph-box, .ph-card {
            background: #fffaf3;
            border: 1px solid #e4d2bc;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(77, 48, 25, .08);
            color: #4b3020;
        }
        .ph-box { padding: 16px; margin-bottom: 20px; }
        .ph-box h3 { margin: 0 0 10px; }

        .ph-pick {
            display: inline-block;
            padding: 10px 16px;
            border-radius: 10px;
            background: #6b4228;
            color: #fff;
            cursor: pointer;
            font-weight: 600;
        }
        .ph-preview { margin-top: 12px; display: none; }
        .ph-preview img {
            width: 100%;
            max-height: 320px;
            object-fit: contain;
            border-radius: 10px;
            background: #f1e8da;
        }
        .ph-preview textarea {
            width: 100%;
            box-sizing: border-box;
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #d8c5ae;
            border-radius: 9px;
            font: inherit;
            resize: vertical;
        }
        .ph-actions { display: flex; gap: 8px; margin-top: 10px; }
        .ph-actions button {
            padding: 10px 16px;
            border: 0;
            border-radius: 9px;
            cursor: pointer;
            font: inherit;
            font-weight: 600;
        }
        .ph-post { background: #2f7d4f; color: #fff; }
        .ph-cancel { background: #e6d2b7; color: #593a25; }
        .ph-actions button:disabled { opacity: .6; cursor: wait; }
        .ph-msg { margin: 10px 0 0; font-size: .88rem; color: #a12626; }

        .ph-card { margin-bottom: 18px; overflow: hidden; }
        .ph-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; }
        .ph-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #6b4228;
            color: #fff;
            font-weight: 700;
            flex-shrink: 0;
        }
        .ph-who { flex: 1; min-width: 0; }
        .ph-who b { display: block; overflow-wrap: anywhere; }
        .ph-who span { font-size: .78rem; color: #80644c; }
        .ph-del {
            border: 0;
            background: none;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 6px;
        }
        .ph-img {
            display: block;
            width: 100%;
            max-height: 560px;
            object-fit: contain;
            background: #f1e8da;
        }
        .ph-foot { padding: 10px 14px 14px; }
        .ph-like {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border: 1px solid #e4d2bc;
            border-radius: 20px;
            background: #fff;
            color: #4b3020;
            cursor: pointer;
            font: inherit;
            font-size: .95rem;
        }
        .ph-like.liked { background: #fde8ea; border-color: #f2b6bc; color: #b3202f; }
        .ph-caption { margin: 10px 0 0; overflow-wrap: anywhere; line-height: 1.45; }
        .ph-empty { text-align: center; padding: 30px 10px; color: #80644c; }
        .ph-more {
            display: block;
            margin: 0 auto;
            padding: 9px 20px;
            border: 1px solid #d7c1a7;
            border-radius: 9px;
            background: #f5ebde;
            color: #593a25;
            cursor: pointer;
            font: inherit;
        }
    `;
    document.head.appendChild(style);

    /* ---------- PAGE ---------- */

    const page = document.createElement("main");
    page.id = "photosPage";
    page.className = "hidden";
    page.innerHTML = `
        <section class="page-title">
            <h1>📸 Photos</h1>
            <p>Share your book photos. Everyone can see and like them.</p>
        </section>

        <div class="ph-wrap">
            <section class="ph-box">
                <h3>➕ Share a photo</h3>
                <label class="ph-pick" for="phFile">📷 Choose photo</label>
                <input type="file" id="phFile" accept="image/*" hidden>

                <div class="ph-preview" id="phPreview">
                    <img id="phPreviewImg" alt="Preview">
                    <textarea id="phCaption" rows="2" maxlength="200"
                        placeholder="Write something about this photo (optional)"></textarea>
                    <div class="ph-actions">
                        <button type="button" class="ph-post" id="phPost">Post</button>
                        <button type="button" class="ph-cancel" id="phCancel">Cancel</button>
                    </div>
                </div>
                <p class="ph-msg" id="phMsg"></p>
            </section>

            <section id="phFeed"></section>
        </div>
    `;
    statisticsPage.insertAdjacentElement("afterend", page);

    const fileInput = document.getElementById("phFile");
    const preview = document.getElementById("phPreview");
    const previewImg = document.getElementById("phPreviewImg");
    const captionInput = document.getElementById("phCaption");
    const postBtn = document.getElementById("phPost");
    const cancelBtn = document.getElementById("phCancel");
    const msg = document.getElementById("phMsg");
    const feed = document.getElementById("phFeed");

    /* ---------- NAV LINK + নিচের মেনু বার ---------- */

    const link = document.createElement("a");
    link.href = "#";
    link.id = "photosLink";
    link.className = "nav-link";
    link.textContent = "Photos";

    if (navbar) navbar.appendChild(link);

    const bar = document.querySelector(".bottom-bar");
    let barButton = null;

    if (bar) {
        barButton = document.createElement("button");
        barButton.type = "button";
        barButton.dataset.page = "photos";
        barButton.innerHTML = `<span class="bb-icon">📸</span><span>Photos</span>`;

        const statsButton = bar.querySelector('button[data-page="statistics"]');

        if (statsButton) {
            bar.insertBefore(barButton, statsButton);
        } else {
            bar.appendChild(barButton);
        }

        barButton.addEventListener("click", function () {
            window.showPage("photos");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const previousShowPage = window.showPage;

    window.showPage = function (name) {
        page.classList.add("hidden");
        link.classList.remove("active");

        if (barButton) barButton.classList.remove("active");

        if (name === "photos") {
            previousShowPage("__none__");

            page.classList.remove("hidden");
            link.classList.add("active");

            if (barButton) barButton.classList.add("active");
        } else {
            previousShowPage(name);
        }
    };

    link.addEventListener("click", function (event) {
        event.preventDefault();
        window.showPage("photos");
    });

    /* ---------- HELPERS ---------- */

    function esc(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function nameOf(user) {
        if (!user) return "Reader";
        if (user.displayName) return user.displayName;
        if (user.email) return user.email.split("@")[0];
        return "Reader";
    }

    function formatDate(ms) {
        const d = new Date(ms);

        return d.toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
        }) + " • " + d.toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit"
        });
    }

    function showMsg(text) {
        msg.textContent = text || "";
    }

    /* ছবি ছোট করে (ফ্রি ডেটাবেসে রাখার জন্য) */

    function compress(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();

            reader.onerror = function () { reject(new Error("Could not read the file.")); };

            reader.onload = function (e) {
                const img = new Image();

                img.onerror = function () { reject(new Error("This is not a valid image.")); };

                img.onload = function () {
                    const attempts = [[1000, 0.72], [800, 0.62], [640, 0.55], [480, 0.5]];

                    for (const [maxSide, quality] of attempts) {
                        let w = img.width;
                        let h = img.height;
                        const scale = Math.min(1, maxSide / Math.max(w, h));

                        w = Math.round(w * scale);
                        h = Math.round(h * scale);

                        const canvas = document.createElement("canvas");
                        canvas.width = w;
                        canvas.height = h;
                        canvas.getContext("2d").drawImage(img, 0, 0, w, h);

                        const data = canvas.toDataURL("image/jpeg", quality);

                        if (data.length < 700000) {
                            resolve(data);
                            return;
                        }
                    }

                    reject(new Error("The photo is too large. Try a smaller one."));
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    }

    /* ---------- RENDER ---------- */

    function render() {
        if (photos.length === 0) {
            feed.innerHTML = `<div class="ph-empty">📷 No photos yet. Be the first to share one!</div>`;
            return;
        }

        const html = photos.map(function (p) {
            const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
            const liked = uid && likedBy.includes(uid);
            const mine = uid && p.ownerId === uid;
            const name = p.ownerName || "Reader";
            const safeImage = String(p.image || "").startsWith("data:image/") ? p.image : "";

            return `
                <article class="ph-card" data-id="${esc(p.id)}">
                    <div class="ph-head">
                        <div class="ph-avatar">${esc(name.charAt(0).toUpperCase())}</div>
                        <div class="ph-who">
                            <b>${esc(name)}${mine ? " (You)" : ""}</b>
                            <span>${esc(formatDate(p.createdAt))}</span>
                        </div>
                        ${mine ? `<button class="ph-del" data-action="delete" title="Delete photo">🗑️</button>` : ""}
                    </div>
                    ${safeImage ? `<img class="ph-img" src="${esc(safeImage)}" alt="" loading="lazy">` : ""}
                    <div class="ph-foot">
                        <button class="ph-like ${liked ? "liked" : ""}" data-action="like">
                            ${liked ? "❤️" : "🤍"} <span>${likedBy.length}</span>
                        </button>
                        ${p.caption ? `<p class="ph-caption">${esc(p.caption)}</p>` : ""}
                    </div>
                </article>
            `;
        }).join("");

        const more = photos.length >= maxPhotos
            ? `<button type="button" class="ph-more" id="phMore">See more</button>`
            : "";

        feed.innerHTML = html + more;
    }

    /* ---------- LOAD (realtime) ---------- */

    function subscribe() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        if (!uid) return;

        const myUid = uid;

        unsubscribe = onSnapshot(
            query(collection(db, "photos"), orderBy("createdAt", "desc"), limit(maxPhotos)),
            function (snap) {
                if (uid !== myUid) return;

                photos = snap.docs.map(function (d) {
                    return Object.assign({ id: d.id }, d.data());
                });

                render();
            },
            function (error) {
                console.error(error);
                feed.innerHTML = `<div class="ph-empty">Could not load photos: ${esc(error.message)}</div>`;
            }
        );
    }

    onAuthStateChanged(auth, function (user) {
        uid = user ? user.uid : null;

        photos = [];
        maxPhotos = PAGE_SIZE;
        resetForm();
        render();
        subscribe();
    });

    /* ---------- UPLOAD ---------- */

    function resetForm() {
        pendingImage = "";
        fileInput.value = "";
        captionInput.value = "";
        previewImg.removeAttribute("src");
        preview.style.display = "none";
        showMsg("");
    }

    fileInput.addEventListener("change", async function () {
        const file = fileInput.files[0];

        if (!file) return;

        showMsg("Preparing photo...");

        try {
            pendingImage = await compress(file);

            previewImg.src = pendingImage;
            preview.style.display = "block";
            showMsg("");
        } catch (error) {
            pendingImage = "";
            preview.style.display = "none";
            showMsg(error.message);
        }
    });

    cancelBtn.addEventListener("click", resetForm);

    postBtn.addEventListener("click", async function () {
        if (!uid) {
            showMsg("Please log in first.");
            return;
        }

        if (!pendingImage) return;

        postBtn.disabled = true;
        postBtn.textContent = "Posting...";

        const now = Date.now();
        const id = uid + "_" + now;

        try {
            await setDoc(doc(db, "photos", id), {
                ownerId: uid,
                ownerName: nameOf(auth.currentUser),
                image: pendingImage,
                caption: captionInput.value.trim(),
                createdAt: now,
                likedBy: []
            });

            resetForm();
        } catch (error) {
            console.error(error);
            showMsg("Could not post: " + error.message);
        } finally {
            postBtn.disabled = false;
            postBtn.textContent = "Post";
        }
    });

    /* ---------- LIKE / DELETE / SEE MORE ---------- */

    feed.addEventListener("click", async function (event) {
        if (event.target.closest("#phMore")) {
            maxPhotos += PAGE_SIZE;
            subscribe();
            return;
        }

        const button = event.target.closest("button[data-action]");

        if (!button || !uid) return;

        const card = button.closest(".ph-card");
        const id = card.dataset.id;
        const photo = photos.find(function (p) { return p.id === id; });

        if (!photo) return;

        try {
            if (button.dataset.action === "like") {
                const liked = Array.isArray(photo.likedBy) && photo.likedBy.includes(uid);

                await updateDoc(doc(db, "photos", id), {
                    likedBy: liked ? arrayRemove(uid) : arrayUnion(uid)
                });
            } else if (button.dataset.action === "delete") {
                if (confirm("Delete this photo?")) {
                    await deleteDoc(doc(db, "photos", id));
                }
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong: " + error.message);
        }
    });

    render();
}