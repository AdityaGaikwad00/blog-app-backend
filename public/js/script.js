// ---------- Settings ----------
// If the page is opened from Express (port 5000) we use a relative path.
// If it is opened from Live Server (port 5500), we call the backend on port 5000.
const API_URL = ["5500", "5501"].includes(location.port) ? "http://localhost:5000/api" : "/api";

// ---------- Theme (light / dark), remembered in the browser ----------
document.documentElement.dataset.theme = localStorage.getItem("theme") || "light";

// ---------- Helpers ----------
// A JWT is three parts joined by dots. The middle part holds the expiry time (exp, in seconds).
function tokenExpired(token) {
  try { return JSON.parse(atob(token.split(".")[1])).exp * 1000 < Date.now(); } catch { return true; }
}
// The browser only remembers WHO is logged in (a token). Users and blogs live in MongoDB.
const session = {
  get token() {
    const t = localStorage.getItem("token");
    if (t && tokenExpired(t)) {                       // session management: expired tokens are dropped
      localStorage.removeItem("token"); localStorage.removeItem("currentUser");
      sessionStorage.setItem("expired", "1");
      return null;
    }
    return t;
  },
  get user() { try { return JSON.parse(localStorage.getItem("currentUser")); } catch { return null; } },
  save(token, user) { localStorage.setItem("token", token); localStorage.setItem("currentUser", JSON.stringify(user)); },
  clear() { localStorage.removeItem("token"); localStorage.removeItem("currentUser"); }
};

// One function for every call to the backend
async function api(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (session.token) headers.Authorization = "Bearer " + session.token;

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && session.token) { session.clear(); }
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Small pop-up message (replaces alert)
function toast(message, type = "ok") {
  const box = document.createElement("div");
  box.className = "toast " + type;
  box.setAttribute("role", "status");
  box.textContent = message;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

// Is the logged-in user the author of this blog?
const user = session.user;
const isMine = (b) => Boolean(user && session.token && b.user && String(b.user) === String(user.id));

// Each card links to the details page. If manage is true, it also shows Edit and Delete buttons.
function blogCard(b, manage = false) {
  const excerpt = b.content.length > 110 ? b.content.slice(0, 110) + "..." : b.content;
  const id = encodeURIComponent(b._id);
  const mins = Math.max(1, Math.round(b.content.split(/\s+/).length / 200));
  const actions = manage
    ? `<div class="card-actions">
         <a class="btn btn-small btn-outline" href="edit-blog.html?id=${id}">Edit</a>
         <button type="button" class="btn btn-small btn-danger" data-delete="${escapeHTML(b._id)}">Delete</button>
       </div>`
    : "";
  return `<article class="card">
    <span class="tag" data-cat="${escapeHTML(b.category)}">${escapeHTML(b.category)}</span>
    <h3><a href="blog.html?id=${id}">${escapeHTML(b.title)}</a></h3>
    <p>${escapeHTML(excerpt)}</p>
    <span class="meta">By ${escapeHTML(b.author)} on ${escapeHTML(b.date)} &middot; ${mins} min read</span>
    <a class="read-more" href="blog.html?id=${id}">Read more</a>
    ${actions}
  </article>`;
}

// Asks "Are you sure?", then deletes the blog on the server. Returns true if it was deleted.
async function deleteBlog(id) {
  if (!confirm("Delete this blog? This cannot be undone.")) return false;
  try {
    await api("/blogs/" + encodeURIComponent(id), "DELETE");
    toast("Blog deleted");
    return true;
  } catch (err) {
    toast(err.message, "error");
    return false;
  }
}

function showError(msg) { document.getElementById("formError").textContent = msg; }
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ---------- Navbar (all pages) ----------
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => nav.classList.toggle("open"));

if (user && session.token) {
  const loginLink = document.getElementById("loginLink");
  loginLink.textContent = "Logout";
  loginLink.href = "#";
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    session.clear();
    window.location.href = "index.html";
  });
  document.getElementById("registerLink").style.display = "none";
  document.getElementById("profileLink").style.display = "";
}

const page = document.body.dataset.page;

// ---------- Home (with search and category filter) ----------
if (page === "home") {
  const grid = document.getElementById("blogGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  function loadBlogs() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (categoryFilter.value !== "All") params.set("category", categoryFilter.value);
    const query = params.toString() ? "?" + params.toString() : "";

    api("/blogs" + query)
      .then((blogs) => {
        grid.innerHTML = blogs.length
          ? blogs.map((b) => blogCard(b)).join("")
          : '<p class="empty">No blogs found. Try a different word or category.</p>';
      })
      .catch((err) => { grid.innerHTML = `<p class="empty">${escapeHTML(err.message)}</p>`; });
  }

  document.getElementById("filterForm").addEventListener("submit", (e) => { e.preventDefault(); loadBlogs(); });
  categoryFilter.addEventListener("change", loadBlogs);
  document.getElementById("clearFilter").addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "All";
    loadBlogs();
  });
  loadBlogs();
}

// ---------- Blog details (Edit and Delete show only for the author) ----------
if (page === "post") {
  const box = document.getElementById("postBox");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    box.innerHTML = '<p class="empty">No blog selected. <a href="index.html">Go back home</a>.</p>';
  } else {
    api("/blogs/" + encodeURIComponent(id))
      .then((b) => {
        document.title = b.title + " | InkWell Blog";
        const actions = isMine(b)
          ? `<div class="post-actions">
               <a class="btn btn-small btn-outline" href="edit-blog.html?id=${encodeURIComponent(b._id)}">Edit</a>
               <button type="button" class="btn btn-small btn-danger" id="deleteBtn">Delete</button>
             </div>`
          : "";
        box.innerHTML = `<span class="tag" data-cat="${escapeHTML(b.category)}">${escapeHTML(b.category)}</span>
          <h1>${escapeHTML(b.title)}</h1>
          <p class="meta">By ${escapeHTML(b.author)} on ${escapeHTML(b.date)}</p>
          ${actions}
          <div class="post-body">${escapeHTML(b.content)}</div>
          <p><a href="index.html">&larr; Back to all posts</a></p>`;

        const deleteBtn = document.getElementById("deleteBtn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", async () => {
            if (await deleteBlog(b._id)) window.location.href = "dashboard.html";
          });
        }
      })
      .catch((err) => { box.innerHTML = `<p class="empty">${escapeHTML(err.message)} <a href="index.html">Go back home</a>.</p>`; });
  }
}

// ---------- Register ----------
if (page === "register") {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    // quick checks in the browser, the server checks again
    if (!name) return showError("Enter your full name.");
    if (!validEmail(email)) return showError("Enter a valid email address.");
    if (password.length < 6) return showError("Password must be at least 6 characters.");
    if (password !== confirm) return showError("Passwords do not match.");

    try {
      await api("/auth/register", "POST", { name, email, password });
      window.location.href = "login.html";
    } catch (err) { showError(err.message); }
  });
}

// ---------- Login ----------
if (page === "login") {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!validEmail(email) || !password) return showError("Enter your email and password.");

    try {
      const data = await api("/auth/login", "POST", { email, password });
      session.save(data.token, data.user);
      window.location.href = "dashboard.html";
    } catch (err) { showError(err.message); }
  });
}

// ---------- Dashboard (Edit and Delete buttons on every card) ----------
if (page === "dashboard") {
  if (!user || !session.token) {
    window.location.href = "login.html";
  } else {
    const list = document.getElementById("myBlogs");
    document.getElementById("welcome").textContent = `Signed in as ${user.name}`;
    document.getElementById("greeting").textContent = `Welcome back, ${user.name.split(" ")[0]}`;

    function loadMine() {
      api("/blogs/mine")
        .then((mine) => {
          document.getElementById("statPosts").textContent = mine.length;
          document.getElementById("statWords").textContent = mine.reduce((n, b) => n + b.content.split(/\s+/).length, 0);
          document.getElementById("statCats").textContent = new Set(mine.map((b) => b.category)).size;
          list.innerHTML = mine.length
            ? mine.map((b) => blogCard(b, true)).join("")
            : '<p class="empty">You have not written anything yet. Select New blog to start.</p>';
        })
        .catch(() => { window.location.href = "login.html"; });
    }

    // One listener for all Delete buttons (event delegation)
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-delete]");
      if (btn && (await deleteBlog(btn.dataset.delete))) loadMine();
    });

    loadMine();
  }
}

// ---------- Create blog ----------
if (page === "create") {
  if (!user || !session.token) {
    window.location.href = "login.html";
  } else {
    document.getElementById("blogForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const category = document.getElementById("category").value;
      const content = document.getElementById("content").value.trim();
      if (title.length < 3) return showError("Title must be at least 3 characters.");
      if (content.length < 20) return showError("Write at least 20 characters of content.");

      try {
        await api("/blogs", "POST", { title, category, content });
        window.location.href = "dashboard.html";
      } catch (err) { showError(err.message); }
    });
  }
}

// ---------- Edit blog ----------
if (page === "edit") {
  const id = new URLSearchParams(location.search).get("id");
  if (!user || !session.token) {
    window.location.href = "login.html";
  } else if (!id) {
    window.location.href = "dashboard.html";
  } else {
    // 1) load the old values into the form
    api("/blogs/" + encodeURIComponent(id))
      .then((b) => {
        if (!isMine(b)) { window.location.href = "dashboard.html"; return; }
        document.getElementById("title").value = b.title;
        document.getElementById("category").value = b.category;
        document.getElementById("content").value = b.content;
      })
      .catch(() => { window.location.href = "dashboard.html"; });

    // 2) send the new values to the server
    document.getElementById("blogForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const category = document.getElementById("category").value;
      const content = document.getElementById("content").value.trim();
      if (title.length < 3) return showError("Title must be at least 3 characters.");
      if (content.length < 20) return showError("Write at least 20 characters of content.");

      try {
        await api("/blogs/" + encodeURIComponent(id), "PUT", { title, category, content });
        window.location.href = "dashboard.html";
      } catch (err) { showError(err.message); }
    });
  }
}


// ---------- Theme toggle (all pages) ----------
const themeBtn = document.getElementById("themeBtn");
function paintThemeButton() { themeBtn.innerHTML = document.documentElement.dataset.theme === "dark" ? "&#9790;" : "&#9788;"; }
paintThemeButton();
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  paintThemeButton();
});

// ---------- Login page: tell the user if the session expired ----------
if (page === "login" && sessionStorage.getItem("expired")) {
  sessionStorage.removeItem("expired");
  showError("Your session expired. Please log in again.");
}

// ---------- Profile ----------
if (page === "profile") {
  if (!user || !session.token) {
    window.location.href = "login.html";
  } else {
    const setMsg = (id, text, ok) => {
      const el = document.getElementById(id);
      el.textContent = text;
      el.className = "form-msg " + (ok ? "ok" : "bad");
    };

    api("/auth/me")
      .then(({ user: u, stats }) => {
        document.getElementById("avatar").textContent = u.name.charAt(0).toUpperCase();
        document.getElementById("pName").textContent = u.name;
        document.getElementById("pEmail").textContent = u.email;
        document.getElementById("pJoined").textContent = "Member since " + new Date(u.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
        document.getElementById("pPosts").textContent = stats.posts;
        document.getElementById("pWords").textContent = stats.words;
        document.getElementById("nameInput").value = u.name;
        document.getElementById("bioInput").value = u.bio;
      })
      .catch(() => { window.location.href = "login.html"; });

    document.getElementById("profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("nameInput").value.trim();
      const bio = document.getElementById("bioInput").value.trim();
      if (name.length < 2) return setMsg("profileMsg", "Name must be at least 2 characters.", false);
      try {
        const data = await api("/auth/me", "PUT", { name, bio });
        session.save(data.token, data.user);              // the token holds the name, so we store the new one
        document.getElementById("pName").textContent = data.user.name;
        document.getElementById("avatar").textContent = data.user.name.charAt(0).toUpperCase();
        setMsg("profileMsg", "Profile saved.", true);
        toast("Profile updated");
      } catch (err) { setMsg("profileMsg", err.message, false); }
    });

    document.getElementById("passwordForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      if (newPassword.length < 6) return setMsg("passwordMsg", "New password must be at least 6 characters.", false);
      if (newPassword !== document.getElementById("confirmNew").value) return setMsg("passwordMsg", "New passwords do not match.", false);
      try {
        await api("/auth/password", "PUT", { currentPassword, newPassword });
        e.target.reset();
        setMsg("passwordMsg", "Password changed.", true);
        toast("Password changed");
      } catch (err) { setMsg("passwordMsg", err.message, false); }
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      session.clear();
      window.location.href = "login.html";
    });
  }
}
