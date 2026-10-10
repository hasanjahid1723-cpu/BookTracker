import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore, doc, collection, getDocs, getDoc, setDoc, deleteDoc,
    onSnapshot, query, where
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

function needLogin() {
    return Promise.reject(new Error("Not logged in"));
}

function nameOf(user) {
    if (!user) return "Reader";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Reader";
}

/* সবার বই থাকে sharedBooks-এ। প্রতিটা বইয়ে ownerId ও ownerName থাকে। */

window.cloud = {
    getUid: function () { return uid; },

    getName: function () { return nameOf(auth.currentUser); },

    saveBook: function (book) {
        if (!uid) return needLogin();
        return setDoc(doc(db, "sharedBooks", uid + "_" + book.id), book);
    },

    deleteBook: function (id) {
        if (!uid) return needLogin();
        return deleteDoc(doc(db, "sharedBooks", uid + "_" + id));
    },

    /* লক্ষ্য, গোল ও স্ট্রিক শুধু নিজের, তাই আলাদা জায়গায় */
    saveSettings: function (settings) {
        if (!uid) return needLogin();
        return setDoc(doc(db, "users", uid, "settings", "main"), settings);
    }
};

/* আগের (ব্যক্তিগত) বইগুলো সবার তালিকায় সরিয়ে আনে */
async function moveOldPrivateBooks(user) {
    const oldSnap = await getDocs(collection(db, "users", user.uid, "books"));

    for (const d of oldSnap.docs) {
        const book = d.data();

        book.ownerId = user.uid;
        book.ownerName = nameOf(user);

        await setDoc(doc(db, "sharedBooks", user.uid + "_" + book.id), book);
        await deleteDoc(d.ref);
    }
}

/* এই ডিভাইসের localStorage-এর পুরনো বই (শুধু একবার, যদি নিজের কোনো বই না থাকে) */
async function offerLocalBooks(user) {
    const mine = await getDocs(
        query(collection(db, "sharedBooks"), where("ownerId", "==", user.uid))
    );

    if (!mine.empty) return null;

    let oldBooks = [];

    try {
        oldBooks = JSON.parse(localStorage.getItem("myBooks")) || [];
    } catch (e) {
        oldBooks = [];
    }

    if (oldBooks.length === 0) return null;

    const ok = confirm(
        "এই ডিভাইসে আগের " + oldBooks.length +
        "টি বই পাওয়া গেছে। সেগুলো আপনার অ্যাকাউন্টে তুলে নেব? (সবাই দেখতে পাবে)"
    );

    if (!ok) return null;

    for (const book of oldBooks) {
        book.ownerId = user.uid;
        book.ownerName = nameOf(user);

        await setDoc(doc(db, "sharedBooks", user.uid + "_" + book.id), book);
    }

    const settings = {
        yearlyGoal: Number(localStorage.getItem("yearlyGoal")) || 10,
        readingStreak: Number(localStorage.getItem("readingStreak")) || 0,
        lastReadingDate: localStorage.getItem("lastReadingDate") || ""
    };

    await setDoc(doc(db, "users", user.uid, "settings", "main"), settings);

    return settings;
}

onAuthStateChanged(auth, async function (user) {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    if (!user) {
        uid = null;
        window.bookApp.reset();
        return;
    }

    uid = user.uid;
    const myUid = user.uid;

    try {
        await moveOldPrivateBooks(user);

        let settings = null;

        const migratedSettings = await offerLocalBooks(user);

        if (migratedSettings) {
            settings = migratedSettings;
        } else {
            const snap = await getDoc(doc(db, "users", myUid, "settings", "main"));
            settings = snap.exists() ? snap.data() : {};
        }

        let first = true;

        unsubscribe = onSnapshot(
            collection(db, "sharedBooks"),
            function (snap) {
                if (uid !== myUid) return;

                const list = snap.docs.map(function (d) { return d.data(); });

                if (first) {
                    first = false;
                    window.bookApp.setData(list, settings);
                } else {
                    window.bookApp.setBooks(list);
                }
            },
            function (error) {
                console.error(error);
                alert("ডেটা লোড করা যায়নি: " + error.message);
            }
        );
    } catch (error) {
        console.error(error);
        alert("ডেটা লোড করা যায়নি: " + error.message);
    }
});