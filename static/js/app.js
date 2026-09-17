const overlay = document.getElementById("chatOverlay");
const openChat = document.getElementById("openChat");
const closeChat = document.getElementById("closeChat");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const projectGrid = document.getElementById("projectGrid");
const themeToggle = document.getElementById("themeToggle");

// Voice Mode Elements
const voiceToggle = document.getElementById("voiceToggle");
const voiceStatusBar = document.getElementById("voiceStatusBar");
const voiceStatusText = document.getElementById("voiceStatusText");
const voiceCancelBtn = document.getElementById("voiceCancelBtn");
const voiceSelect = document.getElementById("voiceSelect");
const micBtn = document.getElementById("micBtn");

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
  unlockMobileAudio();
  overlay.classList.add("open");
  if (question) {
    input.value = question;
    setTimeout(() => form.requestSubmit(), 80);
  } else {
    setTimeout(() => input.focus(), 100);
  }
}

openChat.addEventListener("click", () => showChat());
closeChat.addEventListener("click", () => {
  stopVoiceAndSpeech();
  overlay.classList.remove("open");
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    stopVoiceAndSpeech();
    overlay.classList.remove("open");
  }
});

document.querySelectorAll("[data-question]").forEach(btn => {
  btn.addEventListener("click", () => {
    unlockMobileAudio();
    showChat(btn.dataset.question);
  });
});

function addMessage(text, type) {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

const conversationHistory = [];
let isGenerating = false;

/* =========================================================================
   VOICE MODE & MOBILE-OPTIMIZED MALE VOICE ENGINE
   ========================================================================= */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

let isVoiceMode = false;
let isListening = false;
let isSpeaking = false;
let recognition = null;
let currentUtterance = null;
let activeSpeakingEl = null;
let isAudioUnlocked = false;

// Mobile Autoplay Audio Unlock: Pre-warms SpeechSynthesis on user touch/click
function unlockMobileAudio() {
  if (!synth) return;
  if (!isAudioUnlocked) {
    try {
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0.01;
      silent.rate = 10;
      synth.speak(silent);
      isAudioUnlocked = true;
    } catch (_) {}
  }
  if (synth.paused) {
    synth.resume();
  }
}

// Global user touch unlock
document.addEventListener("touchstart", () => unlockMobileAudio(), { passive: true });
document.addEventListener("click", () => unlockMobileAudio(), { passive: true });

// Filter out all female voices
const FEMALE_IDENTIFIERS = [
  "female", "woman", "girl", "neerja", "pallavi", "heera", "priya", "zira", 
  "swara", "shreya", "ananya", "aarohi", "kavya", "leila", "geeta", "veena", 
  "sita", "lekha", "sangeeta", "jenny", "aria", "ava", "emma", "samantha", 
  "victoria", "karen", "moira", "fiona", "tessa", "alice", "hazel", "susan",
  "dina", "chiara", "elena", "luciana", "mia", "steffi", "kendra", "joanna"
];

function isFemaleVoice(v) {
  const name = (v.name || "").toLowerCase();
  return FEMALE_IDENTIFIERS.some(f => name.includes(f));
}

let cachedVoices = [];
function getAvailableMaleVoices() {
  if (!synth) return [];
  if (!cachedVoices.length) cachedVoices = synth.getVoices();
  // Filter for male voices that speak English (so mobile phones can synthesize English words)
  const englishMale = cachedVoices.filter(v => {
    const lang = (v.lang || "").toLowerCase();
    const isEnglish = lang.startsWith("en");
    return isEnglish && !isFemaleVoice(v);
  });
  
  if (englishMale.length > 0) return englishMale;

  // Fallback: any voice that is not explicitly female
  return cachedVoices.filter(v => !isFemaleVoice(v));
}

function getSelectedOrBestMaleVoice() {
  const maleVoices = getAvailableMaleVoices();
  if (!maleVoices.length) return cachedVoices[0] || null;

  // 1. User selected from dropdown
  if (voiceSelect && voiceSelect.value) {
    const chosen = maleVoices.find(v => v.name === voiceSelect.value);
    if (chosen) return chosen;
  }

  // 2. Saved preference in localStorage
  const saved = localStorage.getItem("preferredMaleVoice");
  if (saved) {
    const chosen = maleVoices.find(v => v.name === saved);
    if (chosen) return chosen;
  }

  // 3. Indian English Male Voice (e.g. Rishi on iOS/Mac, Google English India on Android, Ravi on Windows)
  const indianEnglishMale = maleVoices.find(v => {
    const name = v.name.toLowerCase();
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    const isIndian = lang.includes("en-in") || name.includes("india") || name.includes("indian");
    const isMale = name.includes("rishi") || name.includes("ravi") || name.includes("karan") || name.includes("male");
    return isIndian && isMale && !name.includes("prabhat");
  });
  if (indianEnglishMale) return indianEnglishMale;

  // 4. Any Indian English Male
  const anyIndianMale = maleVoices.find(v => {
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    const name = v.name.toLowerCase();
    return (lang.includes("en-in") || name.includes("india")) && !name.includes("prabhat");
  }) || maleVoices.find(v => {
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    return lang.includes("en-in") || v.name.toLowerCase().includes("india");
  });
  if (anyIndianMale) return anyIndianMale;

  // 5. High-quality natural English male voice (Daniel on iOS, Google US English Male on Android, David on Windows)
  const qualityMale = maleVoices.find(v => {
    const name = v.name.toLowerCase();
    return name.includes("daniel") || name.includes("rishi") || name.includes("david") || 
           name.includes("mark") || name.includes("george") || name.includes("guy") || name.includes("ryan");
  });
  if (qualityMale) return qualityMale;

  return maleVoices[0];
}

function populateVoiceDropdown() {
  if (!voiceSelect) return;
  const maleVoices = getAvailableMaleVoices();
  if (!maleVoices.length) return;

  voiceSelect.innerHTML = "";
  const best = getSelectedOrBestMaleVoice();

  maleVoices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    const cleanName = v.name
      .replace("Microsoft ", "")
      .replace(" Online (Natural)", "")
      .replace(" Desktop", "")
      .replace(" English (India)", " (IN)")
      .replace(" English (United States)", " (US)");
    opt.textContent = `${cleanName} [Male]`;
    if (best && v.name === best.name) {
      opt.selected = true;
    }
    voiceSelect.appendChild(opt);
  });

  voiceSelect.onchange = () => {
    localStorage.setItem("preferredMaleVoice", voiceSelect.value);
  };
}

function loadVoices() {
  if (synth) {
    cachedVoices = synth.getVoices();
    if (cachedVoices.length > 0) {
      populateVoiceDropdown();
    }
  }
}
loadVoices();
if (synth && synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
}

// Update voice status UI
function updateVoiceUI(status, customText = "") {
  if (!voiceStatusBar) return;

  if (status === "hidden") {
    voiceStatusBar.style.display = "none";
    voiceStatusBar.className = "voice-status-bar";
    if (micBtn) micBtn.classList.remove("listening");
    return;
  }

  voiceStatusBar.style.display = "flex";
  voiceStatusBar.className = `voice-status-bar ${status}`;

  if (status === "listening") {
    voiceStatusText.textContent = customText || "Listening... Speak your question";
    if (micBtn) micBtn.classList.add("listening");
  } else if (status === "speaking") {
    const currentVoice = getSelectedOrBestMaleVoice();
    const voiceName = currentVoice ? currentVoice.name.replace("Microsoft ", "").replace(" Online (Natural)", "").replace(" - English (India)", "").replace(" - Tamil (India)", "") : "Male Voice";
    voiceStatusText.textContent = customText || `Speaking (${voiceName})...`;
    if (micBtn) micBtn.classList.remove("listening");
  } else if (status === "processing") {
    voiceStatusText.textContent = customText || "Processing speech...";
    if (micBtn) micBtn.classList.remove("listening");
  } else if (status === "idle") {
    voiceStatusText.textContent = customText || "Voice Mode ready. Speak or tap Stop.";
    if (micBtn) micBtn.classList.remove("listening");
  }
}

// Initialize Speech Recognition
function initRecognition() {
  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-IN"; // English (India) for South Indian speech recognition

  rec.onstart = () => {
    isListening = true;
    unlockMobileAudio();
    updateVoiceUI("listening");
  };

  rec.onresult = (event) => {
    let interim = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (interim) {
      input.value = interim;
    }

    if (finalTranscript) {
      input.value = finalTranscript.trim();
      unlockMobileAudio();
      updateVoiceUI("processing");
      setTimeout(() => {
        form.requestSubmit();
      }, 120);
    }
  };

  rec.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    isListening = false;
    if (event.error === "not-allowed") {
      alert("Microphone permission was denied. Please allow microphone access in your mobile browser settings.");
      setVoiceMode(false);
    } else if (event.error === "no-speech") {
      if (isVoiceMode && !isSpeaking && !isGenerating) {
        updateVoiceUI("idle", "No speech detected. Tap mic or speak again.");
      } else {
        updateVoiceUI("idle", "No speech detected.");
      }
    } else {
      if (isVoiceMode && !isSpeaking && !isGenerating) {
        updateVoiceUI("idle");
      } else if (!isVoiceMode) {
        updateVoiceUI("hidden");
      }
    }
  };

  rec.onend = () => {
    isListening = false;
    if (!isVoiceMode) {
      updateVoiceUI("hidden");
    } else if (!isSpeaking && !isGenerating) {
      updateVoiceUI("idle");
    }
  };

  return rec;
}

recognition = initRecognition();

function startListening() {
  unlockMobileAudio();
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this mobile browser. Please open the portfolio in Google Chrome or Safari.");
    setVoiceMode(false);
    return;
  }
  if (isSpeaking) {
    stopSpeaking();
  }
  if (isListening) return;

  try {
    if (!recognition) {
      recognition = initRecognition();
    }
    recognition.start();
  } catch (err) {
    console.warn("Could not start recognition:", err);
  }
}

function stopListening() {
  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (_) {}
  }
  isListening = false;
}

// Speak assistant response using Male voice (Mobile & Desktop Compatible)
function speakAssistantResponse(rawText, messageElement = null) {
  if (!synth) return;
  
  // Make sure mobile synth is unpaused
  if (synth.paused) {
    synth.resume();
  }
  synth.cancel();

  // Clean text
  let speechText = rawText
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/Sources:[\s\S]*$/i, "")
    .replace(/[*_~#>[\]]/g, "")
    .replace(/[•·]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  if (!speechText) {
    if (isVoiceMode) startListening();
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(speechText);
  // Attach to window so mobile browsers don't garbage-collect it mid-speech!
  window._activeUtterance = currentUtterance;

  // Language assignment for mobile
  currentUtterance.lang = "en-IN";

  const voice = getSelectedOrBestMaleVoice();
  if (voice) {
    currentUtterance.voice = voice;
    if (voice.lang) {
      currentUtterance.lang = voice.lang;
    }
  }

  // Pitch & Cadence tuning for South Indian male delivery
  currentUtterance.rate = 1.04;
  currentUtterance.pitch = 0.98;

  currentUtterance.onstart = () => {
    isSpeaking = true;
    updateVoiceUI("speaking");
    if (messageElement) {
      activeSpeakingEl = messageElement;
      messageElement.classList.add("speaking");
    }
  };

  currentUtterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    window._activeUtterance = null;
    if (activeSpeakingEl) {
      activeSpeakingEl.classList.remove("speaking");
      activeSpeakingEl = null;
    }

    if (isVoiceMode) {
      setTimeout(() => {
        if (isVoiceMode && !isGenerating) {
          startListening();
        }
      }, 400);
    } else {
      updateVoiceUI("hidden");
    }
  };

  currentUtterance.onerror = (e) => {
    console.warn("Speech synthesis error on mobile:", e);
    isSpeaking = false;
    currentUtterance = null;
    window._activeUtterance = null;
    if (activeSpeakingEl) {
      activeSpeakingEl.classList.remove("speaking");
      activeSpeakingEl = null;
    }
    if (isVoiceMode) {
      startListening();
    } else {
      updateVoiceUI("hidden");
    }
  };

  // Mobile safety resume right before speaking
  if (synth.paused) {
    synth.resume();
  }
  synth.speak(currentUtterance);
}

function stopSpeaking() {
  if (synth) {
    synth.cancel();
  }
  isSpeaking = false;
  currentUtterance = null;
  window._activeUtterance = null;
  if (activeSpeakingEl) {
    activeSpeakingEl.classList.remove("speaking");
    activeSpeakingEl = null;
  }
}

function stopVoiceAndSpeech() {
  stopSpeaking();
  stopListening();
  if (!isVoiceMode) {
    updateVoiceUI("hidden");
  } else {
    updateVoiceUI("idle");
  }
}

function setVoiceMode(enabled) {
  unlockMobileAudio();
  isVoiceMode = enabled;
  if (voiceToggle) {
    voiceToggle.classList.toggle("active", enabled);
    const label = voiceToggle.querySelector(".voice-label");
    if (label) {
      label.textContent = enabled ? "Voice ON" : "Voice Mode";
    }
  }

  if (enabled) {
    updateVoiceUI("listening");
    startListening();
  } else {
    stopVoiceAndSpeech();
    updateVoiceUI("hidden");
  }
}

// Voice Toggle Click
if (voiceToggle) {
  voiceToggle.addEventListener("click", () => {
    unlockMobileAudio();
    setVoiceMode(!isVoiceMode);
  });
}

// Push-to-talk Mic Button in chat form
if (micBtn) {
  micBtn.addEventListener("click", () => {
    unlockMobileAudio();
    if (isListening) {
      stopListening();
      updateVoiceUI(isVoiceMode ? "idle" : "hidden");
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  });
}

// Cancel / Stop button in voice status bar
if (voiceCancelBtn) {
  voiceCancelBtn.addEventListener("click", () => {
    if (isSpeaking) {
      stopSpeaking();
      if (isVoiceMode) {
        startListening();
      } else {
        updateVoiceUI("hidden");
      }
    } else if (isListening) {
      stopListening();
      updateVoiceUI(isVoiceMode ? "idle" : "hidden");
    }
  });
}

/* =========================================================================
   FORM SUBMISSION & CHAT INTERACTION
   ========================================================================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;

  unlockMobileAudio();

  // Interrupt ongoing speech if user submits a new question
  if (isSpeaking) {
    stopSpeaking();
  }
  stopListening();

  addMessage(question, "user");
  input.value = "";
  input.disabled = true;
  isGenerating = true;

  if (isVoiceMode) {
    updateVoiceUI("processing", "Thinking of answer...");
  }

  const thinking = addMessage("Thinking...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        message: question,
        history: conversationHistory.slice(-8)
      })
    });

    const data = await response.json();
    thinking.remove();

    const rawAnswer = data.answer || "I couldn't generate an answer.";
    let displayAnswer = rawAnswer;
    if (data.sources && data.sources.length) {
      displayAnswer += "\n\nSources: " + data.sources.join(" • ");
    }
    const botMsgEl = addMessage(displayAnswer, "bot");

    // Track conversational context
    conversationHistory.push({ role: "user", content: question });
    conversationHistory.push({ role: "assistant", content: rawAnswer });
    if (conversationHistory.length > 12) {
      conversationHistory.splice(0, conversationHistory.length - 12);
    }

    // Voice response if Voice Mode is active
    if (isVoiceMode) {
      // Mobile check: ensure synth is active
      unlockMobileAudio();
      speakAssistantResponse(rawAnswer, botMsgEl);
    }
  } catch (error) {
    thinking.textContent = "Sorry, the assistant is temporarily unavailable. Please try again.";
    if (isVoiceMode) {
      updateVoiceUI("idle", "Error occurred. Please try again.");
    }
  } finally {
    isGenerating = false;
    input.disabled = false;
    input.focus();
    if (!isVoiceMode && !isSpeaking) {
      updateVoiceUI("hidden");
    }
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
