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

/* =========================================================================
   PROJECTS, FILTERING & LIVE INTERACTIVE DEMO SANDBOX
   ========================================================================= */

let allProjects = [];
let activeFilter = "all";
let currentDemoProject = null;
let isSandboxRunning = false;

const demoModalOverlay = document.getElementById("demoModalOverlay");
const closeDemoModal = document.getElementById("closeDemoModal");
const demoModalTitle = document.getElementById("demoModalTitle");
const demoModalType = document.getElementById("demoModalType");
const demoModalDesc = document.getElementById("demoModalDesc");
const demoRuntime = document.getElementById("demoRuntime");
const sandboxInput = document.getElementById("sandboxInput");
const sandboxRunBtn = document.getElementById("sandboxRunBtn");
const sandboxTerminal = document.getElementById("sandboxTerminal");
const demoModalExternalLink = document.getElementById("demoModalExternalLink");
const demoModalGithubLink = document.getElementById("demoModalGithubLink");

const projectFiltersContainer = document.getElementById("projectFilters");

// Interactive simulation sequences for each personal project
const PROJECT_SANDBOX_CONFIGS = {
  nexusgraph: {
    defaultPrompt: "Coordinate sub-agents to synthesize API schema and self-heal failed query",
    runtime: "FastAPI + LangGraph Stateful Engine",
    steps: [
      { type: "prompt", text: "> [NexusGraph Orchestrator] Trigger received: \"{prompt}\"" },
      { type: "node", text: "⚡ [SupervisorNode] Initialized state graph. Routing to: PlannerAgent" },
      { type: "output", text: "   • Task decomposed into 3 sub-goals: (1) Schema Discovery, (2) Tool Synthesis, (3) Output Verification." },
      { type: "node", text: "⚡ [ToolExecutionNode] Invoking Qdrant vector retrieval + API validation tool..." },
      { type: "node", text: "⚠️ [ErrorRecoveryNode] Detected schema mismatch in field 'status_code'. Triggering automated AST correction..." },
      { type: "success", text: "✓ [Self-Healing Cycle] Graph state updated. Self-correction resolved in 1 iteration." },
      { type: "output", text: "🚀 [FinalResult] Multi-agent orchestration cycle complete (Execution time: 412ms)." }
    ]
  },
  documind: {
    defaultPrompt: "Ingest multi-column scanned enterprise financial PDF and extract balance ratios",
    runtime: "FastAPI + Milvus Hybrid RAG",
    steps: [
      { type: "prompt", text: "> [DocuMind Pipeline] Ingestion started: \"{prompt}\"" },
      { type: "node", text: "⚡ [PyMuPDF + Tesseract] Extracted 14 document pages. Layout parser identified 4 complex tables." },
      { type: "node", text: "⚡ [EmbeddingNode] Generating dense embeddings (text-embedding-3) + sparse BM25 tokens." },
      { type: "node", text: "⚡ [HybridSearchNode] Milvus vector database queried. Retrieved top-20 candidate chunks." },
      { type: "node", text: "⚡ [CrossEncoderRerank] Cross-encoder score computed: 0.942 relevance for balance sheet." },
      { type: "success", text: "✓ [HallucinationGuard] Grounding verified against source page 7. Citations anchored." },
      { type: "output", text: "🚀 [Response] Document intelligence synthesized with 100% verified source citations." }
    ]
  },
  querygenie: {
    defaultPrompt: "Find all customers with revenue > $50K and return their average ticket size",
    runtime: "FastAPI + PostgreSQL AST Sandbox",
    steps: [
      { type: "prompt", text: "> [QueryGenie] Natural language query: \"{prompt}\"" },
      { type: "node", text: "⚡ [SchemaDiscovery] Metadata cache inspected: Found 'customers', 'invoices', 'orders' tables." },
      { type: "node", text: "⚡ [LLM Generator] Generated PostgreSQL query with JOIN and GROUP BY aggregation." },
      { type: "node", text: "⚡ [SQLGlot AST Validator] AST parsed. Query syntax and column references validated: OK." },
      { type: "node", text: "⚡ [Sandbox Execution] Executed against isolated Postgres read-only replica." },
      { type: "success", text: "✓ [Result Verified] Query returned 142 records in 18ms. Explaining query execution plan." },
      { type: "output", text: "🚀 [SQL Generated] SELECT c.id, c.name, AVG(i.amount) FROM customers c JOIN invoices i GROUP BY c.id, c.name;" }
    ]
  },
  omnivoice: {
    defaultPrompt: "Initiate voice WebSocket stream and ask for portfolio summary",
    runtime: "FastAPI + WebSockets + Whisper & Sarvam AI",
    steps: [
      { type: "prompt", text: "> [OmniVoice Engine] Duplex WebSocket handshake established on ws://api/v1/voice/stream" },
      { type: "node", text: "⚡ [AudioInbound] Chunked PCM audio frames streamed at 16kHz sample rate." },
      { type: "node", text: "⚡ [Whisper Stream] Sub-second transcription: \"Tell me about Deepan's backend systems\"" },
      { type: "node", text: "⚡ [Agentic Dispatch] Async function calling activated -> Retrieving candidate profile context." },
      { type: "success", text: "✓ [Sarvam Audio Stream] Chunked voice synthesis generated and pushed back over WebSocket." },
      { type: "output", text: "🚀 [Duplex Round-Trip] End-to-end voice latency: 340ms." }
    ]
  },
  cricpredict: {
    defaultPrompt: "Simulate chase of 178 runs at Eden Gardens with 3 wickets down after 10 overs",
    runtime: "FastAPI + Scikit-Learn + Monte Carlo",
    steps: [
      { type: "prompt", text: "> [CricPredict Analytics] Scenario: \"{prompt}\"" },
      { type: "node", text: "⚡ [ETL & Feature Pipeline] Loaded ball-by-ball feature matrix using Pandas & NumPy." },
      { type: "node", text: "⚡ [Model Inference] XGBoost win probability evaluated: 58.4% current win probability." },
      { type: "node", text: "⚡ [Monte Carlo Engine] Launching 10,000 stochastic trajectory iterations with bowler match-ups..." },
      { type: "success", text: "✓ [Simulation Complete] Median target reach: 18.4 overs. 95% Confidence Interval: [17.1, 19.5]." },
      { type: "output", text: "🚀 [Optimal Batting Order] Recommended next batter: Anchor vs Leg-spin matchup." }
    ]
  },
  proposalcraft: {
    defaultPrompt: "Generate enterprise multi-phase AI transformation proposal for retail bank",
    runtime: "FastAPI + LangGraph Document Synthesizer",
    steps: [
      { type: "prompt", text: "> [ProposalCraft Agent] Processing RFP specification: \"{prompt}\"" },
      { type: "node", text: "⚡ [Requirements Extractor] Extracted 6 core deliverables and compliance constraints." },
      { type: "node", text: "⚡ [Section Planner] Assembled Executive Summary, Architecture, Timeline, and Pricing tables." },
      { type: "node", text: "⚡ [Document Generator] Compiled ReportLab PDF layout + structured PPTX deck." },
      { type: "success", text: "✓ [Export Ready] Multi-format artifact package generated (PDF, PPTX, DOCX)." },
      { type: "output", text: "🚀 [Download Ready] Executive proposal package built in 2.8s." }
    ]
  }
};

function renderProjects() {
  if (!projectGrid) return;
  const filtered = activeFilter === "all"
    ? allProjects
    : allProjects.filter(p => p.category === activeFilter);

  if (filtered.length === 0) {
    projectGrid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px;">No projects found for this category.</p>`;
    return;
  }

  projectGrid.innerHTML = filtered.map(p => `
    <article class="project" data-category="${p.category}" data-id="${p.id}">
      <div class="project-top">
        <div class="project-header-meta">
          <span class="project-type">${p.type}</span>
          <span class="project-badge ${p.is_live ? 'badge-live' : ''}" ${p.is_live ? 'title="Render Free Tier: Instance enters sleep when idle and wakes up on request (~30–50s cold start)"' : ''}>${p.is_live ? 'Live on Render' : (p.badge || "System")}</span>
        </div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
      </div>
      <div class="project-bottom">
        <div class="tags">${(p.technologies || []).map(t => `<span>${t}</span>`).join("")}</div>
        <div class="project-actions">
          ${p.is_live ? `
            <a href="${p.demo_url}" class="project-btn demo-btn live-link-btn" target="_blank" rel="noopener noreferrer" data-project-title="${p.title}" title="Launch Live App on Render (Free tier: wakes up in ~30–50s if idle)">
              <span class="pulse-dot"></span>
              <span>Live App ↗</span>
            </a>
            <button type="button" class="project-btn code-btn sandbox-trigger-btn" data-demo-id="${p.id}" title="Launch Interactive Simulation Sandbox">
              <span>Sandbox ⚙</span>
            </button>
          ` : `
            <button type="button" class="project-btn demo-btn" data-demo-id="${p.id}" title="Launch Interactive Live Demo">
              <span class="pulse-dot"></span>
              <span>Simulation ↗</span>
            </button>
          `}
          <a href="${p.github_url}" class="project-btn code-btn" target="_blank" rel="noopener noreferrer" title="View Source Code on GitHub">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </article>
  `).join("");

  attachDemoButtons();
}

/* =========================================================================
   RENDER FREE TIER PRE-WARMING & WAKE-UP LOGIC
   ========================================================================= */
const prewarmedUrls = new Set();
function prewarmService(url) {
  if (!url || !url.includes("onrender.com") || prewarmedUrls.has(url)) return;
  prewarmedUrls.add(url);
  try {
    fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
  } catch (_) {}
}

function prewarmAllRenderServices() {
  if (!allProjects || !allProjects.length) return;
  const liveProjects = allProjects.filter(p => p.is_live && p.demo_url && p.demo_url.includes("onrender.com"));
  liveProjects.forEach((p, idx) => {
    setTimeout(() => {
      prewarmService(p.demo_url);
    }, 1500 + idx * 800);
  });
}

function showRenderWakeToast(title) {
  let toast = document.getElementById("renderWakeToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "renderWakeToast";
    toast.className = "render-wake-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="toast-indicator-pulse"></div>
    <div class="toast-content">
      <div class="toast-title">Connecting to <strong>${title}</strong>...</div>
      <div class="toast-desc">Render free-tier service is waking up (~30–50s if asleep). Please keep the new tab open!</div>
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss">✕</button>
  `;
  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.onclick = () => toast.classList.remove("show");
  }
  toast.classList.add("show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 10000);
}

function attachDemoButtons() {
  document.querySelectorAll(".demo-btn, .sandbox-trigger-btn").forEach(btn => {
    if (btn.tagName === "BUTTON") {
      btn.addEventListener("click", () => {
        const projectId = btn.dataset.demoId;
        openDemoModalForProject(projectId);
      });
    }
  });

  // Handle live link clicks to show friendly cold-start toast
  document.querySelectorAll(".live-link-btn").forEach(link => {
    link.addEventListener("click", () => {
      const title = link.dataset.projectTitle || "Render App";
      showRenderWakeToast(title);
    });
  });

  // Pre-warm on mouseenter or touch
  document.querySelectorAll(".project").forEach(card => {
    const onWarm = () => {
      const id = card.dataset.id;
      const proj = allProjects.find(p => p.id === id);
      if (proj && proj.is_live) {
        prewarmService(proj.demo_url);
      }
    };
    card.addEventListener("mouseenter", onWarm, { passive: true });
    card.addEventListener("touchstart", onWarm, { passive: true });
  });
}

function openDemoModalForProject(projectId) {
  const project = allProjects.find(p => p.id === projectId) || allProjects[0];
  if (!project) return;
  currentDemoProject = project;

  const cfg = PROJECT_SANDBOX_CONFIGS[project.id] || {
    defaultPrompt: `Execute ${project.title} pipeline`,
    runtime: "FastAPI Microservice",
    steps: [
      { type: "prompt", text: `> Running ${project.title}...` },
      { type: "node", text: "⚡ Initializing execution graph..." },
      { type: "success", text: "✓ Pipeline completed successfully." }
    ]
  };

  const demoStatusIndicator = document.querySelector(".demo-status-indicator");
  if (demoModalTitle) demoModalTitle.textContent = project.title;
  if (demoModalType) demoModalType.textContent = project.is_live ? "Live Deployment" : (project.badge || project.type);
  if (demoModalDesc) demoModalDesc.textContent = project.description;
  if (demoRuntime) demoRuntime.textContent = project.is_live ? `${cfg.runtime} • Production on Render` : cfg.runtime;
  if (sandboxInput) sandboxInput.value = cfg.defaultPrompt;
  if (demoModalExternalLink) {
    demoModalExternalLink.href = project.demo_url || "#";
    if (project.is_live) {
      demoModalExternalLink.innerHTML = '<span class="pulse-dot"></span> <span>Launch Live Render App ↗</span>';
      demoModalExternalLink.classList.add("btn-live-accent");
      demoModalExternalLink.setAttribute("data-project-title", project.title);
    } else {
      demoModalExternalLink.innerHTML = '<span>Launch Standalone App ↗</span>';
      demoModalExternalLink.classList.remove("btn-live-accent");
      demoModalExternalLink.removeAttribute("data-project-title");
    }
  }
  if (demoStatusIndicator) {
    if (project.is_live) {
      demoStatusIndicator.innerHTML = `● Live Production on Render <span class="render-sleep-badge" title="Free tier instance sleeps when idle and wakes on request (~30–50s cold start)">Free Tier: Wakes on Request (~30s)</span>`;
      demoStatusIndicator.classList.add("status-live");
    } else {
      demoStatusIndicator.textContent = "● Interactive Simulation Sandbox Active";
      demoStatusIndicator.classList.remove("status-live");
    }
  }
  if (demoModalGithubLink) demoModalGithubLink.href = project.github_url || "https://github.com/Deeps72-ux";

  if (sandboxTerminal) {
    sandboxTerminal.innerHTML = `
      <div class="term-line prompt">> [System] Ready to run interactive live sandbox for ${project.title}.</div>
      <div class="term-line prompt">> Click "▶ Run Pipeline" to trigger the autonomous workflow.</div>
    `;
  }

  if (demoModalOverlay) {
    demoModalOverlay.classList.add("open");
  }

  // Pre-warm if live
  if (project.is_live && project.demo_url) {
    prewarmService(project.demo_url);
  }
}

function closeDemo() {
  if (demoModalOverlay) {
    demoModalOverlay.classList.remove("open");
  }
}

if (closeDemoModal) {
  closeDemoModal.addEventListener("click", closeDemo);
}

if (demoModalOverlay) {
  demoModalOverlay.addEventListener("click", (e) => {
    if (e.target === demoModalOverlay) closeDemo();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDemo();
  }
});

if (sandboxRunBtn) {
  sandboxRunBtn.addEventListener("click", async () => {
    if (isSandboxRunning || !currentDemoProject) return;
    isSandboxRunning = true;
    sandboxRunBtn.disabled = true;
    sandboxRunBtn.textContent = "⏳ Running...";

    const cfg = PROJECT_SANDBOX_CONFIGS[currentDemoProject.id] || {
      steps: [
        { type: "prompt", text: "> Executing..." },
        { type: "success", text: "✓ Complete." }
      ]
    };

    const userPrompt = (sandboxInput ? sandboxInput.value.trim() : "") || "Run default agent sequence";
    if (sandboxTerminal) {
      sandboxTerminal.innerHTML = "";
    }

    for (const step of cfg.steps) {
      const lineText = step.text.replace("{prompt}", userPrompt);
      const div = document.createElement("div");
      div.className = `term-line ${step.type}`;
      div.textContent = lineText;
      if (sandboxTerminal) {
        sandboxTerminal.appendChild(div);
        sandboxTerminal.scrollTop = sandboxTerminal.scrollHeight;
      }
      await new Promise(r => setTimeout(r, 450));
    }

    sandboxRunBtn.disabled = false;
    sandboxRunBtn.textContent = "▶ Run Pipeline";
    isSandboxRunning = false;
  });
}

// Setup Category Filter Buttons
if (projectFiltersContainer) {
  projectFiltersContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderProjects();
  });
}

if (demoModalExternalLink) {
  demoModalExternalLink.addEventListener("click", () => {
    if (currentDemoProject && currentDemoProject.is_live) {
      showRenderWakeToast(currentDemoProject.title);
    }
  });
}

async function loadProjects() {
  try {
    const response = await fetch("/api/projects");
    const data = await response.json();
    allProjects = data.projects || [];
    renderProjects();
    prewarmAllRenderServices();
  } catch (err) {
    if (projectGrid) {
      projectGrid.innerHTML = "<p>Projects could not be loaded.</p>";
    }
  }
}

loadProjects();

/* =========================================================================
   LUXURY CONTACT CONCIERGE AGENT (Autonomous Intake & Direct Dispatch)
   ========================================================================= */

const contactChatForm = document.getElementById("contactChatForm");
const contactChatInput = document.getElementById("contactChatInput");
const contactChatSubmit = document.getElementById("contactChatSubmit");
const contactMessages = document.getElementById("contactMessages");
const contactChips = document.querySelectorAll("[data-contact-starter]");
const trackName = document.getElementById("trackName");
const trackEmail = document.getElementById("trackEmail");
const trackCompany = document.getElementById("trackCompany");
const directDispatchBtn = document.getElementById("directDispatchBtn");
const dispatchHint = document.getElementById("dispatchHint");
const dispatchBanner = document.getElementById("dispatchBanner");
const dispatchBannerDetail = document.getElementById("dispatchBannerDetail");

const contactLead = {
  name: null,
  email: null,
  company: null,
  message: null
};

const contactHistory = [];
const contactTranscript = [];
let isContactSending = false;
let isContactDispatched = false;

function updateContactHUD() {
  if (trackName) {
    const valEl = trackName.querySelector(".hud-val");
    if (valEl) {
      if (contactLead.name) {
        valEl.textContent = contactLead.name;
        trackName.classList.add("captured");
      } else {
        valEl.textContent = "Waiting...";
        trackName.classList.remove("captured");
      }
    }
  }

  if (trackEmail) {
    const valEl = trackEmail.querySelector(".hud-val");
    if (valEl) {
      if (contactLead.email) {
        valEl.textContent = contactLead.email;
        trackEmail.classList.add("captured");
      } else {
        valEl.textContent = "Waiting...";
        trackEmail.classList.remove("captured");
      }
    }
  }

  if (trackCompany) {
    const valEl = trackCompany.querySelector(".hud-val");
    if (valEl) {
      if (contactLead.company) {
        valEl.textContent = contactLead.company;
        trackCompany.classList.add("captured");
      } else {
        valEl.textContent = "—";
        trackCompany.classList.remove("captured");
      }
    }
  }
}

function updateDispatchButton(readyToSend) {
  if (!directDispatchBtn) return;

  if (isContactDispatched) {
    directDispatchBtn.disabled = true;
    directDispatchBtn.classList.remove("ready");
    directDispatchBtn.innerHTML = "<span>✓ Dispatched to Deepan's Gmail</span>";
    if (dispatchHint) {
      dispatchHint.textContent = "Your inquiry has been delivered directly to Deepan's Gmail.";
    }
    return;
  }

  const canDispatch = Boolean(
    readyToSend || 
    (contactLead.email && (contactLead.name || contactLead.message))
  );

  if (canDispatch) {
    directDispatchBtn.disabled = false;
    directDispatchBtn.classList.add("ready");
    if (dispatchHint) {
      dispatchHint.textContent = "Ready! Click above to dispatch your message straight to Deepan's Gmail.";
    }
  } else if (contactLead.email) {
    directDispatchBtn.disabled = true;
    directDispatchBtn.classList.remove("ready");
    if (dispatchHint) {
      dispatchHint.textContent = "Almost there! Please share your name or inquiry requirement.";
    }
  } else {
    directDispatchBtn.disabled = true;
    directDispatchBtn.classList.remove("ready");
    if (dispatchHint) {
      dispatchHint.textContent = "Provide your email & message to enable 1-click dispatch.";
    }
  }
}

function appendContactVisitorMessage(text) {
  if (!contactMessages) return;
  const msgEl = document.createElement("div");
  msgEl.className = "c-msg visitor";
  msgEl.textContent = text;
  contactMessages.appendChild(msgEl);
  contactMessages.scrollTop = contactMessages.scrollHeight;
  return msgEl;
}

function appendContactAgentMessage(text) {
  if (!contactMessages) return;
  const msgEl = document.createElement("div");
  msgEl.className = "c-msg agent";

  const authorEl = document.createElement("div");
  authorEl.className = "msg-author";
  authorEl.textContent = "Deepan's Concierge";

  const bodyEl = document.createElement("div");
  bodyEl.className = "msg-body";
  bodyEl.textContent = text;

  msgEl.appendChild(authorEl);
  msgEl.appendChild(bodyEl);
  contactMessages.appendChild(msgEl);
  contactMessages.scrollTop = contactMessages.scrollHeight;
  return msgEl;
}

function appendContactSystemMessage(text) {
  if (!contactMessages) return;
  const msgEl = document.createElement("div");
  msgEl.className = "c-msg system";
  msgEl.textContent = text;
  contactMessages.appendChild(msgEl);
  contactMessages.scrollTop = contactMessages.scrollHeight;
  return msgEl;
}

async function sendContactMessage(text) {
  if (!text || isContactSending) return;
  isContactSending = true;

  // Add user message to UI & history
  appendContactVisitorMessage(text);
  contactHistory.push({ role: "user", content: text });
  contactTranscript.push({ role: "user", content: text });

  // Disable inputs while processing
  if (contactChatInput) contactChatInput.disabled = true;
  if (contactChatSubmit) contactChatSubmit.disabled = true;

  // Render typing state
  let typingEl = null;
  if (contactMessages) {
    typingEl = document.createElement("div");
    typingEl.className = "c-msg agent";
    typingEl.innerHTML = `
      <div class="msg-author">Deepan's Concierge</div>
      <div class="msg-body">Analyzing & formulating reply...</div>
    `;
    contactMessages.appendChild(typingEl);
    contactMessages.scrollTop = contactMessages.scrollHeight;
  }

  try {
    const res = await fetch("/api/contact/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: contactHistory.slice(-8),
        lead: contactLead
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (typingEl) typingEl.remove();

    // Update lead state if fields extracted
    if (data.lead && typeof data.lead === "object") {
      ["name", "email", "company", "message"].forEach(field => {
        if (data.lead[field] && typeof data.lead[field] === "string" && data.lead[field].trim()) {
          contactLead[field] = data.lead[field].trim();
        }
      });
    }

    updateContactHUD();
    updateDispatchButton(data.ready_to_send);

    const reply = data.reply || "Thanks for your message! Deepan will get back to you shortly.";
    appendContactAgentMessage(reply);
    contactHistory.push({ role: "assistant", content: reply });
    contactTranscript.push({ role: "assistant", content: reply });

  } catch (err) {
    console.error("Contact Concierge error:", err);
    if (typingEl) typingEl.remove();
    appendContactAgentMessage(
      "I encountered a temporary connection issue. You can still reach Deepan directly at deepksami@gmail.com!"
    );
  } finally {
    isContactSending = false;
    if (contactChatInput) {
      contactChatInput.disabled = false;
      contactChatInput.value = "";
      contactChatInput.focus();
    }
    if (contactChatSubmit) {
      contactChatSubmit.disabled = false;
    }
  }
}

// Bind Contact Form Submission
if (contactChatForm) {
  contactChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!contactChatInput) return;
    const msg = contactChatInput.value.trim();
    if (!msg) return;
    sendContactMessage(msg);
  });
}

// Bind Quick Topic Chips
contactChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const starterText = chip.getAttribute("data-contact-starter");
    if (!starterText || isContactSending) return;
    sendContactMessage(starterText);
  });
});

// Bind 1-Click Direct Dispatch to Gmail
if (directDispatchBtn) {
  directDispatchBtn.addEventListener("click", async () => {
    if (isContactSending || isContactDispatched || directDispatchBtn.disabled) return;

    const canSubmit = contactLead.email || contactLead.message;
    if (!canSubmit) return;

    try {
      directDispatchBtn.disabled = true;
      const originalHtml = directDispatchBtn.innerHTML;
      directDispatchBtn.innerHTML = "<span>✉️ Dispatching to Gmail...</span>";
      if (dispatchHint) {
        dispatchHint.textContent = "Connecting to mail server and routing to Deepan's Gmail...";
      }

      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: contactLead,
          transcript: contactTranscript
        })
      });

      const data = await res.json();

      if (data.success) {
        isContactDispatched = true;
        directDispatchBtn.classList.remove("ready");
        directDispatchBtn.disabled = true;
        directDispatchBtn.innerHTML = "<span>✓ Dispatched to Deepan's Gmail</span>";
        if (dispatchHint) {
          dispatchHint.textContent = "Your inquiry has been successfully delivered to Deepan's Gmail.";
        }

        if (dispatchBanner) {
          dispatchBanner.style.display = "flex";
          if (dispatchBannerDetail && data.message) {
            dispatchBannerDetail.textContent = data.message;
          }
          dispatchBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        appendContactSystemMessage(
          "✓ Inquiry successfully dispatched to Deepan's personal Gmail (deepksami@gmail.com)! He will review and respond shortly."
        );
      } else {
        directDispatchBtn.disabled = false;
        directDispatchBtn.innerHTML = originalHtml;
        if (dispatchHint) {
          dispatchHint.textContent = data.error || "Could not dispatch. Please try again.";
        }
      }
    } catch (err) {
      console.error("Direct dispatch failed:", err);
      directDispatchBtn.disabled = false;
      directDispatchBtn.innerHTML = '✉️ <span>Dispatch to Deepan\'s Gmail</span>';
      if (dispatchHint) {
        dispatchHint.textContent = "Dispatch failed. Please email deepksami@gmail.com directly.";
      }
    }
  });
}
