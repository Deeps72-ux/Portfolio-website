
const overlay = document.getElementById("chatOverlay");
const openChat = document.getElementById("openChat");
const closeChat = document.getElementById("closeChat");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const projectGrid = document.getElementById("projectGrid");
const themeToggle = document.getElementById("themeToggle");

// Theme Toggle (Light / Dark mode)
function updateThemeUI(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeToggle) {
    themeToggle.setAttribute(
      "title",
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
  }
}

const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
updateThemeUI(currentTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const active = document.documentElement.getAttribute("data-theme") || "dark";
    const next = active === "light" ? "dark" : "light";
    updateThemeUI(next);
  });
}

function showChat(question = "") {
  overlay.classList.add("open");
  if (question) {
    input.value = question;
    setTimeout(() => form.requestSubmit(), 80);
  } else {
    setTimeout(() => input.focus(), 100);
  }
}

openChat.addEventListener("click", () => showChat());
closeChat.addEventListener("click", () => overlay.classList.remove("open"));

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});

document.querySelectorAll("[data-question]").forEach(btn => {
  btn.addEventListener("click", () => showChat(btn.dataset.question));
});

function addMessage(text, type) {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;

  addMessage(question, "user");
  input.value = "";
  input.disabled = true;

  const thinking = addMessage("Thinking…", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({message: question})
    });

    const data = await response.json();
    thinking.remove();

    let answer = data.answer || "I couldn't generate an answer.";
    if (data.sources?.length) {
      answer += "\n\nSources: " + data.sources.join(" · ");
    }
    addMessage(answer, "bot");
  } catch (error) {
    thinking.textContent = "Sorry, the assistant is temporarily unavailable. Please try again.";
  } finally {
    input.disabled = false;
    input.focus();
  }
});

async function loadProjects() {
  try {
    const response = await fetch("/api/projects");
    const data = await response.json();

    projectGrid.innerHTML = data.projects.map(p => `
      <article class="project">
        <div>
          <div class="project-type">${p.type}</div>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
        </div>
        <div class="tags">${p.technologies.map(t => `<span>${t}</span>`).join("")}</div>
      </article>
    `).join("");
  } catch {
    projectGrid.innerHTML = "<p>Projects could not be loaded.</p>";
  }
}

loadProjects();
