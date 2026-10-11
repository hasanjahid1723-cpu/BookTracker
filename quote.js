/* =========================================================
   💭 আজকের উক্তি: প্রতিদিন নতুন একটা উক্তি, Home পেজের "Reading Motivation" কার্ডে
   (একই দিনে সবাই একই উক্তি দেখে; পরের দিন নিজে থেকে বদলে যায়)
   নতুন উক্তি যোগ করতে চাইলে নিচের তালিকায় একটা লাইন বাড়িয়ে দিন।
========================================================= */

(function () {
    const card = document.querySelector(".motivation-card");

    if (!card) return;

    const quotes = [
        /* ইংরেজি */
        ["Reading is to the mind what exercise is to the body.", "Joseph Addison"],
        ["Books are a uniquely portable magic.", "Stephen King"],
        ["A book is a dream that you hold in your hand.", "Neil Gaiman"],
        ["I have always imagined that Paradise will be a kind of library.", "Jorge Luis Borges"],
        ["A reader lives a thousand lives before he dies.", "George R. R. Martin"],
        ["Reading gives us someplace to go when we have to stay where we are.", "Mason Cooley"],
        ["Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", "J. K. Rowling"],
        ["So many books, so little time.", "Frank Zappa"],
        ["Books are the mirrors of the soul.", "Virginia Woolf"],
        ["A book must be the axe for the frozen sea within us.", "Franz Kafka"],
        ["There is no friend as loyal as a book.", "Ernest Hemingway"],
        ["Not all readers are leaders, but all leaders are readers.", "Harry S. Truman"],
        ["Once you learn to read, you will be forever free.", "Frederick Douglass"],
        ["Reading is a conversation. All books talk. But a good book listens as well.", "Mark Haddon"],
        ["Today a reader, tomorrow a leader.", "Margaret Fuller"],
        ["You can never get a cup of tea large enough or a book long enough to suit me.", "C. S. Lewis"],

        /* বাংলা */
        ["একটা ভালো বই হাজার বন্ধুর সমান।", ""],
        ["বই পড়লে মনের জানালা খুলে যায়।", ""],
        ["আজকের একটা পাতাই কালকের অভ্যাস।", ""],
        ["প্রতিদিন অল্প অল্প পড়ো, একদিন পাহাড় সমান জ্ঞান জমবে।", ""],
        ["বই এমন বন্ধু, যে কখনো ছেড়ে যায় না।", ""],
        ["যে পড়ে, সে অন্য মানুষের জীবনেও ঘুরে আসে।", ""],
        ["বইয়ের পাতায় লুকিয়ে থাকে পুরো এক পৃথিবী।", ""],
        ["আজ অন্তত একটা পাতা পড়ে ফেলো।", ""],
        ["পড়ার সময় বের করতে হয়, সময় এমনি আসে না।", ""],
        ["একটা গল্প শেষ করে আরেকটা শুরু করার আনন্দই আলাদা।", ""],
        ["ভালো বই মনকে বড় করে।", ""],
        ["বই কেনা সহজ, পড়ে শেষ করাটাই আসল জয়।", ""],
        ["নতুন বই খোলার গন্ধটাই একটা ছোট ছুটি।", ""],
        ["যত পড়বে, তত জানবে, তত নিজেকে চিনবে।", ""]
    ];

    function todayIndex() {
        const now = new Date();

        /* আজকের তারিখ (নিজের সময় অনুযায়ী) থেকে একটা দিনের নম্বর */
        const dayNumber = Math.floor(
            Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000
        );

        return dayNumber % quotes.length;
    }

    const heading = card.querySelector("h3");
    const text = card.querySelector("p");
    const author = card.querySelector("span");

    const pick = quotes[todayIndex()];

    if (heading) heading.textContent = "💭 Quote of the Day";
    if (text) text.textContent = "\u201C" + pick[0] + "\u201D";

    if (author) {
        author.textContent = pick[1] ? "— " + pick[1] : "";
        author.style.display = pick[1] ? "" : "none";
    }
})();