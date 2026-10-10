import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore, doc, collection, getDocs, getDoc, setDoc, deleteDoc
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

function needLogin() {
    return Promise.reject(new Error("Not logged in"));
}

window.cloud = {
    saveBook: function (book) {
        if (!uid) return needLogin();
        return setDoc(doc(db, "users", uid, "books", String(book.id)), book);
    },

    deleteBook: function (id) {
        if (!uid) return needLogin();
        return deleteDoc(doc(db, "users", uid, "books", String(id)));
    },

    saveSettings: function (settings) {
        if (!uid) return needLogin();
        return setDoc(doc(db, "users", uid, "settings", "main"), settings);
    }
};

async function migrateOldLocalBooks(myUid) {
    let oldBooks = [];

    try {
        oldBooks = JSON.parse(localStorage.getItem("myBooks")) || [];
    } catch (e) {
        oldBooks = [];
    }

    if (oldBooks.length === 0) return null;

    const ok = confirm(
        "এই ডিভাইসে আগের " + oldBooks.length +
        "টি বই পাওয়া গেছে। সেগুলো আপনার অ্যাকাউন্টে তুলে নেব?"
    );

    if (!ok) return null;

    for (const book of oldBooks) {
        await setDoc(doc(db, "users", myUid, "books", String(book.id)), book);
    }

    const settings = {
        yearlyGoal: Number(localStorage.getItem("yearlyGoal")) || 10,
        readingStreak: Number(localStorage.getItem("readingStreak")) || 0,
        lastReadingDate: localStorage.getItem("lastReadingDate") || ""
    };

    await setDoc(doc(db, "users", myUid, "settings", "main"), settings);

    return { books: oldBooks, settings: settings };
}

onAuthStateChanged(auth, async function (user) {
    if (!user) {
        uid = null;
        window.bookApp.reset();
        return;
    }

    uid = user.uid;
    const myUid = user.uid;

    try {
        const booksSnap = await getDocs(collection(db, "users", myUid, "books"));
        let books = booksSnap.docs.map(function (d) { return d.data(); });

        const settingsSnap = await getDoc(doc(db, "users", myUid, "settings", "main"));
        let settings = settingsSnap.exists() ? settingsSnap.data() : {};

        if (books.length === 0) {
            const migrated = await migrateOldLocalBooks(myUid);

            if (migrated) {
                books = migrated.books;
                settings = migrated.settings;
            }
        }

        if (uid !== myUid) return;

        window.bookApp.setData(books, settings);
    } catch (error) {
        console.error(error);
        alert("ডেটা লোড করা যায়নি: " + error.message);
    }
});