/* ================= DOM ELEMENTS ================= */

const homeLink = document.getElementById("homeLink");
const booksLink = document.getElementById("booksLink");
const statisticsLink = document.getElementById("statisticsLink");

const homePage = document.getElementById("homePage");
const booksPage = document.getElementById("booksPage");
const statisticsPage = document.getElementById("statisticsPage");

const totalBooks = document.getElementById("totalBooks");
const booksRead = document.getElementById("booksRead");
const yearlyGoal = document.getElementById("yearlyGoal");
const averageRating = document.getElementById("averageRating");

const setGoalBtn = document.getElementById("setGoalBtn");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const goalMessage = document.getElementById("goalMessage");

const recentBooks = document.getElementById("recentBooks");

const bookForm = document.getElementById("bookForm");
const bookName = document.getElementById("bookName");
const author = document.getElementById("author");
const genre = document.getElementById("genre");
const bookCover = document.getElementById("bookCover");
const status = document.getElementById("status");
const rating = document.getElementById("rating");
const review = document.getElementById("review");
const saveBookBtn = document.getElementById("saveBookBtn");

const bookSearch = document.getElementById("bookSearch");
const bookSort = document.getElementById("bookSort");

const bookshelf = document.getElementById("bookshelf");
const filterButtons = document.querySelectorAll(".filter-btn");

const statTotalBooks = document.getElementById("statTotalBooks");
const statFinished = document.getElementById("statFinished");
const statReading = document.getElementById("statReading");
const statWantToRead = document.getElementById("statWantToRead");
const statAverageRating = document.getElementById("statAverageRating");
const statYearlyGoal = document.getElementById("statYearlyGoal");
const genreBreakdown = document.getElementById("genreBreakdown");

const readingStreak = document.getElementById("readingStreak");
const streakMessage = document.getElementById("streakMessage");
const readTodayBtn = document.getElementById("readTodayBtn");


/* ================= MODAL ELEMENTS ================= */

const bookModal = document.getElementById("bookModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const modalBookCover = document.getElementById("modalBookCover");
const modalBookName = document.getElementById("modalBookName");
const modalAuthor = document.getElementById("modalAuthor");
const modalGenre = document.getElementById("modalGenre");
const modalStatus = document.getElementById("modalStatus");
const modalRating = document.getElementById("modalRating");
const modalAddedDate = document.getElementById("modalAddedDate");
const modalReview = document.getElementById("modalReview");

const modalEditBtn = document.getElementById("modalEditBtn");
const modalDeleteBtn = document.getElementById("modalDeleteBtn");


/* ================= DATA ================= */

let books = JSON.parse(localStorage.getItem("myBooks")) || [];

let editingBookId = null;

let yearlyGoalValue =
    Number(localStorage.getItem("yearlyGoal")) || 10;

let currentFilter = "All";

let currentModalBookId = null;


/* ================= PAGE NAVIGATION ================= */

function showPage(page) {
    homePage.classList.add("hidden");
    booksPage.classList.add("hidden");
    statisticsPage.classList.add("hidden");

    homeLink.classList.remove("active");
    booksLink.classList.remove("active");
    statisticsLink.classList.remove("active");

    if (page === "home") {
        homePage.classList.remove("hidden");
        homeLink.classList.add("active");
    } else if (page === "books") {
        booksPage.classList.remove("hidden");
        booksLink.classList.add("active");
    } else if (page === "statistics") {
        statisticsPage.classList.remove("hidden");
        statisticsLink.classList.add("active");
    }
}

homeLink.addEventListener("click", function (event) {
    event.preventDefault();
    showPage("home");
});

booksLink.addEventListener("click", function (event) {
    event.preventDefault();
    showPage("books");
});

statisticsLink.addEventListener("click", function (event) {
    event.preventDefault();
    showPage("statistics");
});


/* ================= ESCAPE HTML ================= */

function escapeHTML(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================= SAVE BOOKS ================= */

function saveBooks() {
    localStorage.setItem("myBooks", JSON.stringify(books));
}


/* ================= ADD / EDIT BOOK ================= */

bookForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const nameValue = bookName.value.trim();
    const authorValue = author.value.trim();
    const genreValue = genre.value.trim();
    const statusValue = status.value;
    const ratingValue = Number(rating.value);
    const reviewValue = review.value.trim();

    if (!nameValue || !authorValue || !genreValue) {
        alert("Please fill in all required fields.");
        return;
    }

    /* EDIT EXISTING BOOK */

    if (editingBookId !== null) {
        const bookIndex = books.findIndex(
            book => book.id === editingBookId
        );

        if (bookIndex !== -1) {
            books[bookIndex].name = nameValue;
            books[bookIndex].author = authorValue;
            books[bookIndex].genre = genreValue;
            books[bookIndex].status = statusValue;
            books[bookIndex].rating = ratingValue;
            books[bookIndex].review = reviewValue;

            const file = bookCover.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    books[bookIndex].cover = e.target.result;

                    saveBooks();
                    updateAll();
                    resetForm();
                };

                reader.readAsDataURL(file);
                return;
            }

            saveBooks();
            updateAll();
            resetForm();
        }
    }

    /* ADD NEW BOOK */

    else {
        const file = bookCover.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                createNewBook(e.target.result);
            };

            reader.readAsDataURL(file);
        } else {
            createNewBook("");
        }
    }
});


/* ================= CREATE NEW BOOK ================= */

function createNewBook(coverImage) {
    const newBook = {
        id: Date.now(),
        addedAt: Date.now(),
        name: bookName.value.trim(),
        author: author.value.trim(),
        genre: genre.value.trim(),
        cover: coverImage,
        status: status.value,
        rating: Number(rating.value),
        review: review.value.trim()
    };

    books.push(newBook);

    saveBooks();
    updateAll();
    resetForm();
}


/* ================= RESET FORM ================= */

function resetForm() {
    bookForm.reset();

    editingBookId = null;
    saveBookBtn.textContent = "➕ Add Book";
}


/* ================= DISPLAY BOOKS ================= */

function displayBooks() {
    let filteredBooks = [...books];

    /* STATUS FILTER */

    if (currentFilter !== "All") {
        filteredBooks = filteredBooks.filter(
            book => book.status === currentFilter
        );
    }

    /* SEARCH */

    const searchText = bookSearch.value.trim().toLowerCase();

    if (searchText) {
        filteredBooks = filteredBooks.filter(book => {
            const name = String(book.name || "").toLowerCase();
            const bookAuthor = String(book.author || "").toLowerCase();
            const bookGenre = String(book.genre || "").toLowerCase();

            return (
                name.includes(searchText) ||
                bookAuthor.includes(searchText) ||
                bookGenre.includes(searchText)
            );
        });
    }

    /* SORT */

    const sortType = bookSort.value;

    if (sortType === "newest") {
        filteredBooks.sort(
            (a, b) =>
                (b.addedAt || b.id) - (a.addedAt || a.id)
        );
    } else if (sortType === "oldest") {
        filteredBooks.sort(
            (a, b) =>
                (a.addedAt || a.id) - (b.addedAt || b.id)
        );
    } else if (sortType === "nameAZ") {
        filteredBooks.sort(
            (a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
        );
    } else if (sortType === "nameZA") {
        filteredBooks.sort(
            (a, b) =>
                String(b.name || "").localeCompare(
                    String(a.name || "")
                )
        );
    } else if (sortType === "ratingHigh") {
        filteredBooks.sort(
            (a, b) =>
                Number(b.rating || 0) - Number(a.rating || 0)
        );
    } else if (sortType === "ratingLow") {
        filteredBooks.sort(
            (a, b) =>
                Number(a.rating || 0) - Number(b.rating || 0)
        );
    }

    /* EMPTY STATE */

    if (filteredBooks.length === 0) {
        bookshelf.innerHTML = `
            <div class="no-books">
                <h3>📚 No Books Found</h3>
                <p>
                    Try adding a book or changing your search/filter.
                </p>
            </div>
        `;

        return;
    }

    /* BOOK CARDS */

    bookshelf.innerHTML = filteredBooks.map(book => {
        const stars =
            "⭐".repeat(Number(book.rating || 0)) || "No rating";

        const coverHTML = book.cover
            ? `
                <img
                    src="${book.cover}"
                    alt="${escapeHTML(book.name)}"
                >
            `
            : `
                <div class="book-placeholder">
                    📖
                </div>
            `;

        return `
            <div class="book-card">

                <div class="book-cover">
                    ${coverHTML}
                </div>

                <div class="book-info">

                    <h3>${escapeHTML(book.name)}</h3>

                    <p class="book-author">
                        ✍️ ${escapeHTML(book.author)}
                    </p>

                    <p class="book-genre">
                        📚 ${escapeHTML(book.genre)}
                    </p>

                    <span class="book-status">
                        ${escapeHTML(book.status)}
                    </span>

                    <div class="book-rating">
                        ${stars}
                    </div>

                    ${
                        book.review
                            ? `
                                <div class="book-review">
                                    ${escapeHTML(book.review)}
                                </div>
                            `
                            : ""
                    }

                    <div class="book-actions">

                        <button
                            class="edit-btn"
                            onclick="editBook(${book.id})"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteBook(${book.id})"
                        >
                            🗑️ Delete
                        </button>

                    </div>

                    <button
                        class="details-btn"
                        onclick="openBookModal(${book.id})"
                    >
                        🔍 View Details
                    </button>

                </div>
            </div>
        `;
    }).join("");
}


/* ================= EDIT BOOK ================= */

function editBook(id) {
    const book = books.find(item => item.id === id);

    if (!book) {
        return;
    }

    editingBookId = id;

    bookName.value = book.name || "";
    author.value = book.author || "";
    genre.value = book.genre || "";
    status.value = book.status || "Want to Read";
    rating.value = String(Number(book.rating || 0));
    review.value = book.review || "";
    bookCover.value = "";

    saveBookBtn.textContent = "💾 Update Book";

    showPage("books");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ================= DELETE BOOK ================= */

function deleteBook(id) {
    const book = books.find(item => item.id === id);

    if (!book) {
        return;
    }

    const confirmDelete = confirm(
        `Are you sure you want to delete "${book.name}"?`
    );

    if (!confirmDelete) {
        return;
    }

    books = books.filter(item => item.id !== id);

    saveBooks();
    closeBookModal();
    updateAll();
}


/* ================= SEARCH ================= */

bookSearch.addEventListener("input", displayBooks);


/* ================= SORT ================= */

bookSort.addEventListener("change", displayBooks);


/* ================= BOOK FILTER BUTTONS ================= */

filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        this.classList.add("active");

        currentFilter = this.dataset.filter;

        displayBooks();
    });
});


/* ================= ANIMATED STATISTICS ================= */

function animateStatNumber(element, target, decimals = 0) {
    if (!element) return;

    const finalValue = Number(target) || 0;
    const startValue = Number(element.dataset.currentValue || 0);

    element.dataset.currentValue = String(finalValue);

    const duration = 650;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        const eased = 1 - Math.pow(1 - progress, 3);

        const value =
            startValue + (finalValue - startValue) * eased;

        element.textContent = decimals
            ? value.toFixed(decimals)
            : String(Math.round(value));

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}


/* ================= UPDATE STATISTICS ================= */

function updateStatistics() {
    const total = books.length;

    const finished = books.filter(
        book => book.status === "Finished"
    ).length;

    const reading = books.filter(
        book => book.status === "Reading"
    ).length;

    const wantToRead = books.filter(
        book => book.status === "Want to Read"
    ).length;

    const ratedBooks = books.filter(
        book => Number(book.rating || 0) > 0
    );

    let avgRating = 0;

    if (ratedBooks.length > 0) {
        const totalRating = ratedBooks.reduce(
            (sum, book) => sum + Number(book.rating || 0),
            0
        );

        avgRating = totalRating / ratedBooks.length;
    }

    /* HOME PAGE STATISTICS */

    totalBooks.textContent = total;
    booksRead.textContent = finished;
    yearlyGoal.textContent = yearlyGoalValue;
    averageRating.textContent = avgRating.toFixed(1);

    /* STATISTICS PAGE ANIMATION */

    animateStatNumber(statTotalBooks, total);
    animateStatNumber(statFinished, finished);
    animateStatNumber(statReading, reading);
    animateStatNumber(statWantToRead, wantToRead);
    animateStatNumber(statAverageRating, avgRating, 1);
    animateStatNumber(statYearlyGoal, yearlyGoalValue);

    /* READING PROGRESS */

    let percentage = 0;

    if (yearlyGoalValue > 0) {
        percentage = (finished / yearlyGoalValue) * 100;
    }

    const displayPercentage = Math.min(percentage, 100);

    progressFill.style.width = displayPercentage + "%";
    progressPercent.textContent = Math.round(percentage) + "%";

    progressText.textContent =
        `${finished} / ${yearlyGoalValue} books`;

    /* YEARLY GOAL MESSAGE */

    if (finished === 0) {
        goalMessage.textContent =
            "📚 Start your reading journey today!";
    } else if (finished < yearlyGoalValue) {
        const remaining = yearlyGoalValue - finished;

        goalMessage.textContent =
            `📚 Keep going! Just ${remaining} more book${
                remaining === 1 ? "" : "s"
            } to reach your yearly goal!`;
    } else if (finished === yearlyGoalValue) {
        goalMessage.textContent =
            "🎉 Well done! You have achieved your yearly goal!";
    } else {
        const extra = finished - yearlyGoalValue;

        goalMessage.textContent =
            `🏆 Amazing! You have surpassed your yearly goal by ${extra} book${
                extra === 1 ? "" : "s"
            }!`;
    }

    updateGenreBreakdown();
}


/* ================= YEARLY GOAL ================= */

setGoalBtn.addEventListener("click", function () {
    const newGoal = prompt(
        "Enter your yearly reading goal:",
        yearlyGoalValue
    );

    if (newGoal === null) {
        return;
    }

    const goal = Number(newGoal);

    if (!Number.isInteger(goal) || goal <= 0) {
        alert("Please enter a valid positive number.");
        return;
    }

    yearlyGoalValue = goal;

    localStorage.setItem("yearlyGoal", yearlyGoalValue);

    updateAll();
});


/* ================= RECENT BOOKS ================= */

function updateRecentBooks() {
    if (books.length === 0) {
        recentBooks.innerHTML = `
            <p class="no-recent-books">
                No books added yet.
            </p>
        `;

        return;
    }

    const latestBooks = [...books]
        .sort(
            (a, b) =>
                (b.addedAt || b.id) - (a.addedAt || a.id)
        )
        .slice(0, 3);

    recentBooks.innerHTML = latestBooks.map(book => {
        const coverHTML = book.cover
            ? `
                <img
                    src="${book.cover}"
                    alt="${escapeHTML(book.name)}"
                >
            `
            : `
                <div class="recent-book-cover-placeholder">
                    📖
                </div>
            `;

        return `
            <div class="recent-book">

                ${coverHTML}

                <div class="recent-book-info">

                    <h4>${escapeHTML(book.name)}</h4>

                    <p>${escapeHTML(book.author)}</p>

                    <p>${escapeHTML(book.status)}</p>

                </div>

            </div>
        `;
    }).join("");
}


/* ================= GENRE BREAKDOWN ================= */

function updateGenreBreakdown() {
    if (books.length === 0) {
        genreBreakdown.innerHTML = `
            <p>No books available.</p>
        `;

        return;
    }

    const genreCounts = {};

    books.forEach(book => {
        const bookGenre = book.genre?.trim() || "Unknown";

        genreCounts[bookGenre] =
            (genreCounts[bookGenre] || 0) + 1;
    });

    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1]);

    const maxCount = sortedGenres[0][1];

    genreBreakdown.innerHTML = sortedGenres.map(
        ([genreName, count]) => {
            const percentage = (count / maxCount) * 100;

            return `
                <div class="genre-item">

                    <div class="genre-header">

                        <span>${escapeHTML(genreName)}</span>

                        <strong>${count}</strong>

                    </div>

                    <div class="genre-bar">

                        <div
                            class="genre-fill"
                            style="width: ${percentage}%"
                        ></div>

                    </div>

                </div>
            `;
        }
    ).join("");
}


/* ================= READING STREAK DATE HELPERS ================= */

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getYesterdayDate() {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();

    const month = String(
        yesterday.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        yesterday.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* ================= UPDATE READING STREAK ================= */

function updateStreakDisplay() {
    const streak = Number(
        localStorage.getItem("readingStreak")
    ) || 0;

    const lastDate = localStorage.getItem("lastReadingDate");
    const today = getTodayDate();

    readingStreak.textContent =
        `${streak} Day${streak === 1 ? "" : "s"}`;

    if (streak === 0) {
        streakMessage.textContent =
            "Start your reading streak today!";
    } else if (lastDate === today) {
        streakMessage.textContent =
            "🔥 Great job! You have read today.";
    } else {
        streakMessage.textContent =
            "📖 Keep the streak alive today!";
    }

    if (lastDate === today) {
        readTodayBtn.disabled = true;
        readTodayBtn.textContent = "✅ Read Today";
    } else {
        readTodayBtn.disabled = false;
        readTodayBtn.textContent = "📖 I Read Today";
    }
}


/* ================= I READ TODAY BUTTON ================= */

readTodayBtn.addEventListener("click", function () {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    const lastDate = localStorage.getItem("lastReadingDate");

    let streak = Number(
        localStorage.getItem("readingStreak")
    ) || 0;

    if (lastDate === today) {
        return;
    }

    if (lastDate === yesterday) {
        streak++;
    } else {
        streak = 1;
    }

    localStorage.setItem("readingStreak", streak);
    localStorage.setItem("lastReadingDate", today);

    updateStreakDisplay();
});


/* ================= BOOK DETAILS MODAL ================= */

/* OPEN MODAL */

function openBookModal(id) {
    const book = books.find(item => item.id === id);

    if (!book) {
        return;
    }

    currentModalBookId = id;

    /* BOOK COVER */

    if (book.cover) {
        modalBookCover.src = book.cover;
    } else {
        modalBookCover.src =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="250"
                    height="340"
                    viewBox="0 0 250 340"
                >
                    <rect
                        width="250"
                        height="340"
                        fill="#ead7c0"
                    />

                    <text
                        x="125"
                        y="175"
                        text-anchor="middle"
                        font-size="70"
                    >📖</text>
                </svg>
            `);
    }

    /* BOOK INFORMATION */

    modalBookName.textContent =
        book.name || "Unknown Book";

    modalAuthor.textContent =
        book.author || "Unknown Author";

    modalGenre.textContent =
        book.genre || "Unknown";

    modalStatus.textContent =
        book.status || "Unknown";

    /* RATING */

    const bookRating = Number(book.rating || 0);

    if (bookRating > 0) {
        modalRating.textContent = "⭐".repeat(bookRating);
    } else {
        modalRating.textContent = "No rating";
    }

    /* ADDED DATE */

    if (book.addedAt || book.id) {
        const date = new Date(book.addedAt || book.id);

        modalAddedDate.textContent = date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    } else {
        modalAddedDate.textContent = "Unknown";
    }

    /* REVIEW */

    modalReview.textContent =
        book.review || "No review added yet.";

    /* SHOW MODAL */

    bookModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}


/* ================= CLOSE MODAL ================= */

function closeBookModal() {
    bookModal.classList.add("hidden");

    document.body.style.overflow = "";

    currentModalBookId = null;
}


closeModalBtn.addEventListener("click", closeBookModal);


/* ================= CLICK OUTSIDE MODAL ================= */

bookModal.addEventListener("click", function (event) {
    if (event.target === bookModal) {
        closeBookModal();
    }
});


/* ================= ESC KEY CLOSE MODAL ================= */

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !bookModal.classList.contains("hidden")
    ) {
        closeBookModal();
    }
});


/* ================= MODAL EDIT BUTTON ================= */

modalEditBtn.addEventListener("click", function () {
    if (currentModalBookId === null) {
        return;
    }

    const id = currentModalBookId;

    closeBookModal();
    editBook(id);
});


/* ================= MODAL DELETE BUTTON ================= */

modalDeleteBtn.addEventListener("click", function () {
    if (currentModalBookId === null) {
        return;
    }

    const id = currentModalBookId;

    deleteBook(id);
});


/* ================= UPDATE EVERYTHING ================= */

function updateAll() {
    updateStatistics();
    displayBooks();
    updateRecentBooks();
    updateStreakDisplay();
}


/* =========================================================
   CLICKABLE STATISTICS CARDS
   Total Books  -> All Books
   Finished     -> Finished Books
   Reading      -> Currently Reading Books
   Want to Read -> Want to Read Books
========================================================= */

document.querySelectorAll(
    ".statistics-card[data-status-filter]"
).forEach(card => {

    function openFilteredBooks() {
        currentFilter = card.dataset.statusFilter || "All";

        /* Update active filter button */

        filterButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === currentFilter
            );
        });

        /* Open My Books page */

        showPage("books");

        /* Display books matching selected status */

        displayBooks();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* Mouse click */

    card.addEventListener("click", openFilteredBooks);

    /* Keyboard accessibility */

    card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilteredBooks();
        }
    });
});


/* ================= INITIAL LOAD ================= */

updateAll();

showPage("home");

/* ================= STATISTICS CARD CLICK ================= */

function openBooksFromStatistics(filter) {
    currentFilter = filter;

    // আগের সার্চ মুছে দাও
    if (bookSearch) {
        bookSearch.value = "";
    }

    // সংশ্লিষ্ট ফিল্টার সক্রিয় করো
    filterButtons.forEach(button => {
        const selectedFilter =
            filter === "__YEAR__" || filter === "__RATED__"
                ? "All"
                : filter;

        button.classList.toggle(
            "active",
            button.dataset.filter === selectedFilter
        );
    });

    // বইয়ের পেজ দেখাও
    showPage("books");

    // বইয়ের তালিকা আপডেট করো
    displayBooks();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.querySelectorAll(".statistics-card").forEach((card, index) => {
    card.style.cursor = "pointer";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");

    function handleClick() {
        const action = card.dataset.statAction || [
            "all",
            "finished",
            "reading",
            "want",
            "rated",
            "year"
        ][index];

        const filters = {
            all: "All",
            finished: "Finished",
            reading: "Reading",
            want: "Want to Read",
            rated: "__RATED__",
            year: "__YEAR__"
        };

        openBooksFromStatistics(filters[action] || "All");
    }

    card.addEventListener("click", handleClick);

    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    });
});