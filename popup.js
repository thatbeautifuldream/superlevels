// ═══════════════════════════════════
//  Navigation
// ═══════════════════════════════════
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.remove("active", "text-zinc-100", "bg-white/[0.06]");
      b.classList.add("text-zinc-500");
    });
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    btn.classList.remove("text-zinc-500");
    btn.classList.add("active", "text-zinc-100", "bg-white/[0.06]");
    document.getElementById("page-" + btn.dataset.page).classList.add("active");
    if (btn.dataset.page === "cookies") loadCookies();
    if (btn.dataset.page === "redirects") loadRedirects();
    if (btn.dataset.page === "darkmode") loadDarkMode();
    if (btn.dataset.page === "xdim") loadXDim();
    if (btn.dataset.page === "jstoggle") loadJsToggle();
    if (btn.dataset.page === "nocookie") loadNoCookie();
    if (btn.dataset.page === "livecss") loadLiveCSS();
    if (btn.dataset.page === "unhook") loadUnhook();
    if (btn.dataset.page === "jsonformat") loadJsonFormat();
    if (btn.dataset.page === "music") { loadMusicHistory(); loadAcrFields(); startListening(); }
  });
});

// ═══════════════════════════════════
//  Tab Cleaner
// ═══════════════════════════════════
const enabledEl = document.getElementById("enabled");
const timeoutEl = document.getElementById("timeout");
const hostInput = document.getElementById("hostInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("list");

chrome.storage.local.get(["enabled", "timeoutMin", "exclusions"], (data) => {
  enabledEl.checked = data.enabled !== false;
  timeoutEl.value = data.timeoutMin || 5;
  renderExclusionList(data.exclusions || []);
});

enabledEl.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: enabledEl.checked });
});

timeoutEl.addEventListener("change", () => {
  const val = Math.max(1, Math.min(1440, parseInt(timeoutEl.value) || 5));
  timeoutEl.value = val;
  chrome.storage.local.set({ timeoutMin: val });
});

function addHost() {
  let host = hostInput.value.trim().toLowerCase();
  if (!host) return;
  host = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  chrome.storage.local.get(["exclusions"], (data) => {
    const exclusions = data.exclusions || [];
    if (exclusions.includes(host)) { hostInput.value = ""; return; }
    exclusions.push(host);
    chrome.storage.local.set({ exclusions }, () => {
      hostInput.value = "";
      renderExclusionList(exclusions);
    });
  });
}

addBtn.addEventListener("click", addHost);
hostInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addHost(); });

function removeHost(host) {
  chrome.storage.local.get(["exclusions"], (data) => {
    const exclusions = (data.exclusions || []).filter((h) => h !== host);
    chrome.storage.local.set({ exclusions }, () => renderExclusionList(exclusions));
  });
}

function renderExclusionList(exclusions) {
  if (!exclusions.length) {
    listEl.innerHTML = '<div class="text-zinc-600 text-xs text-center py-3">No exclusions — all tabs can be closed</div>';
    return;
  }
  listEl.innerHTML = exclusions
    .map((h) => `<div class="flex items-center justify-between px-2.5 py-1.5 bg-zinc-900 rounded-md mb-1 text-sm inset-ring inset-ring-white/[0.03]"><span class="break-all min-w-0">${esc(h)}</span><button type="button" data-host="${escA(h)}" class="bg-transparent border-none text-zinc-500 text-sm cursor-pointer px-1 leading-none hover:text-zinc-100">&times;</button></div>`)
    .join("");
  listEl.querySelectorAll("button[data-host]").forEach((btn) => {
    btn.addEventListener("click", () => removeHost(btn.dataset.host));
  });
}

// ── Closed Tabs History ──
const closedSection = document.getElementById("closedSection");

function loadClosedTabs() {
  chrome.storage.local.get(["closed_tabs"], (data) => {
    const closed = data.closed_tabs || [];
    if (!closed.length) {
      closedSection.innerHTML = "";
      return;
    }
    closedSection.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <h2 class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0">Recently Closed</h2>
        <button type="button" id="clearClosed" class="bg-transparent border-none text-zinc-400 text-[11px] cursor-pointer font-medium hover:text-zinc-100">Clear</button>
      </div>
    ` + closed.map((t, i) => `
      <div class="closed-item flex items-center gap-2 px-2.5 py-[7px] bg-zinc-900 rounded-md mb-1 cursor-pointer inset-ring inset-ring-white/[0.03]" data-url="${escA(t.url)}" data-idx="${i}">
        ${t.favIconUrl ? `<img class="w-4 h-4 rounded shrink-0" src="${escA(t.favIconUrl)}" onerror="this.style.display='none'">` : '<div class="w-4 h-4 rounded shrink-0 bg-zinc-800"></div>'}
        <span class="text-xs flex-1 min-w-0 truncate">${esc(t.title)}</span>
        <span class="text-[10px] text-zinc-600 shrink-0 tabular-nums">${timeAgo(t.time)}</span>
        <button type="button" class="reopen bg-transparent border-none text-zinc-400 text-[13px] cursor-pointer shrink-0 px-0.5 hover:text-zinc-100" title="Re-open">&#x2197;</button>
      </div>
    `).join("");

    document.getElementById("clearClosed").addEventListener("click", () => {
      chrome.storage.local.remove("closed_tabs", loadClosedTabs);
    });

    closedSection.querySelectorAll(".closed-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".reopen")) {
          chrome.tabs.create({ url: item.dataset.url });
        } else {
          chrome.tabs.create({ url: item.dataset.url });
        }
      });
    });
  });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

loadClosedTabs();

// ═══════════════════════════════════
//  Cookie Editor
// ═══════════════════════════════════
const cookieDomainEl = document.getElementById("cookieDomain");
const cookieCountEl = document.getElementById("cookieCount");
const cookieListEl = document.getElementById("cookieList");

let currentUrl = "";
let currentDomain = "";
let allCookies = [];

async function loadCookies() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    cookieDomainEl.textContent = "No accessible page";
    cookieCountEl.textContent = "0";
    cookieListEl.innerHTML = '<div class="text-zinc-600 text-xs text-center py-3">Cannot read cookies from this page</div>';
    return;
  }
  currentUrl = tab.url;
  try {
    currentDomain = new URL(tab.url).hostname;
  } catch {
    currentDomain = "";
  }
  cookieDomainEl.textContent = currentDomain;

  const cookies = await chrome.cookies.getAll({ url: tab.url });
  cookies.sort((a, b) => a.name.localeCompare(b.name));
  allCookies = cookies;
  cookieCountEl.textContent = cookies.length;
  renderCookies(cookies);
}

function renderCookies(cookies) {
  if (!cookies.length) {
    cookieListEl.innerHTML = '<div class="text-zinc-600 text-xs text-center py-3">No cookies for this site</div>';
    return;
  }
  cookieListEl.innerHTML = cookies.map((c, i) => `
    <div class="cookie-item bg-zinc-900 rounded-lg mb-1 overflow-hidden inset-ring inset-ring-white/[0.03]" data-idx="${i}">
      <div class="cookie-row flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/[0.02]">
        <span class="cookie-chevron text-[10px] text-zinc-600 shrink-0 w-3.5 text-center transition-transform duration-200">&#9660;</span>
        <span class="cookie-name flex-1 text-sm font-medium truncate">${esc(c.name)}</span>
        <button type="button" class="cookie-del bg-transparent border-none text-zinc-600 text-sm cursor-pointer px-0.5 opacity-0 hover:text-zinc-100" data-delidx="${i}" title="Delete">&times;</button>
      </div>
      <div class="cookie-details hidden px-3 pb-3 pl-[34px]">
        <div class="mb-2"><label class="block text-[11px] text-zinc-500 mb-1 font-medium">Name</label><input type="text" value="${escA(c.name)}" data-field="name" data-i="${i}" class="w-full px-2 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-zinc-300 text-xs font-mono outline-none focus-visible:border-zinc-400"></div>
        <div class="mb-2"><label class="block text-[11px] text-zinc-500 mb-1 font-medium">Value</label><textarea data-field="value" data-i="${i}" class="w-full px-2 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-zinc-300 text-xs font-mono outline-none focus-visible:border-zinc-400 resize-y min-h-[48px]">${esc(c.value)}</textarea></div>
        <button type="button" class="advanced-toggle text-[11px] text-zinc-400 cursor-pointer text-right mb-1.5 bg-transparent border-none font-medium hover:text-zinc-200" data-adv="${i}">Show Advanced</button>
        <div class="advanced-fields" data-advf="${i}">
          <div class="mb-2"><label class="block text-[11px] text-zinc-500 mb-1 font-medium">Domain</label><input type="text" value="${escA(c.domain)}" data-field="domain" data-i="${i}" class="w-full px-2 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-zinc-300 text-xs font-mono outline-none focus-visible:border-zinc-400"></div>
          <div class="mb-2"><label class="block text-[11px] text-zinc-500 mb-1 font-medium">Path</label><input type="text" value="${escA(c.path)}" data-field="path" data-i="${i}" class="w-full px-2 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-zinc-300 text-xs font-mono outline-none focus-visible:border-zinc-400"></div>
          <div class="mb-2"><label class="block text-[11px] text-zinc-500 mb-1 font-medium">SameSite</label><input type="text" value="${escA(c.sameSite || "unspecified")}" data-field="sameSite" data-i="${i}" class="w-full px-2 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-zinc-300 text-xs font-mono outline-none focus-visible:border-zinc-400"></div>
          <div class="text-[11px] text-zinc-500 mb-2">Secure: ${c.secure ? "Yes" : "No"} &nbsp;|&nbsp; HttpOnly: ${c.httpOnly ? "Yes" : "No"}</div>
        </div>
        <div class="flex gap-1.5 mt-1.5">
          <button type="button" class="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-[11px] font-semibold cursor-pointer border-none focus-visible:outline-2 focus-visible:outline-zinc-400 focus-visible:outline-offset-2" data-saveidx="${i}">Save</button>
          <button type="button" class="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md text-[11px] font-semibold cursor-pointer border-none hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-400 focus-visible:outline-offset-2" data-delidx="${i}">Delete</button>
        </div>
      </div>
    </div>
  `).join("");

  cookieListEl.querySelectorAll(".cookie-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".cookie-del")) return;
      const item = row.closest(".cookie-item");
      item.classList.toggle("expanded");
      const details = item.querySelector(".cookie-details");
      details.classList.toggle("hidden");
    });
  });

  cookieListEl.querySelectorAll(".advanced-toggle").forEach((t) => {
    t.addEventListener("click", () => {
      const fields = cookieListEl.querySelector(`.advanced-fields[data-advf="${t.dataset.adv}"]`);
      fields.classList.toggle("hidden");
      t.textContent = fields.classList.contains("hidden") ? "Show Advanced" : "Hide Advanced";
    });
  });

  cookieListEl.querySelectorAll("[data-delidx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCookie(allCookies[parseInt(btn.dataset.delidx)]);
    });
  });

  cookieListEl.querySelectorAll("[data-saveidx]").forEach((btn) => {
    btn.addEventListener("click", () => saveCookie(parseInt(btn.dataset.saveidx)));
  });
}

async function deleteCookie(cookie) {
  const protocol = cookie.secure ? "https" : "http";
  const url = `${protocol}://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
  await chrome.cookies.remove({ url, name: cookie.name });
  loadCookies();
}

async function saveCookie(idx) {
  const original = allCookies[idx];
  const item = cookieListEl.querySelector(`.cookie-item[data-idx="${idx}"]`);

  const nameEl = item.querySelector('[data-field="name"]');
  const valueEl = item.querySelector('[data-field="value"]');
  const domainEl = item.querySelector('[data-field="domain"]');
  const pathEl = item.querySelector('[data-field="path"]');
  const sameSiteEl = item.querySelector('[data-field="sameSite"]');

  const protocol = original.secure ? "https" : "http";
  const oldUrl = `${protocol}://${original.domain.replace(/^\./, "")}${original.path}`;
  await chrome.cookies.remove({ url: oldUrl, name: original.name });

  const domain = domainEl ? domainEl.value : original.domain;
  const path = pathEl ? pathEl.value : original.path;
  const newUrl = `${protocol}://${domain.replace(/^\./, "")}${path}`;

  const details = {
    url: newUrl,
    name: nameEl.value,
    value: valueEl.value,
    path,
    secure: original.secure,
    httpOnly: original.httpOnly,
    sameSite: sameSiteEl ? sameSiteEl.value : original.sameSite || "unspecified",
  };
  if (!original.hostOnly) details.domain = domain;
  if (original.expirationDate) details.expirationDate = original.expirationDate;

  await chrome.cookies.set(details);
  loadCookies();
}

document.getElementById("btnDeleteAll").addEventListener("click", async () => {
  if (!allCookies.length) return;
  for (const c of allCookies) {
    const protocol = c.secure ? "https" : "http";
    const url = `${protocol}://${c.domain.replace(/^\./, "")}${c.path}`;
    await chrome.cookies.remove({ url, name: c.name });
  }
  loadCookies();
});

document.getElementById("btnRefresh").addEventListener("click", () => loadCookies());

document.getElementById("btnExport").addEventListener("click", () => {
  if (!allCookies.length) return;
  const data = JSON.stringify(allCookies, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookies-${currentDomain}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Add Cookie Modal
const addModal = document.getElementById("addModal");
document.getElementById("btnAdd").addEventListener("click", () => {
  document.getElementById("newDomain").value = currentDomain ? "." + currentDomain : "";
  document.getElementById("newPath").value = "/";
  document.getElementById("newName").value = "";
  document.getElementById("newValue").value = "";
  addModal.classList.add("show");
});
document.getElementById("modalCancel").addEventListener("click", () => {
  addModal.classList.remove("show");
});
addModal.addEventListener("click", (e) => {
  if (e.target === addModal) addModal.classList.remove("show");
});
document.getElementById("modalSave").addEventListener("click", async () => {
  const name = document.getElementById("newName").value.trim();
  if (!name) return;
  const domain = document.getElementById("newDomain").value.trim();
  const path = document.getElementById("newPath").value.trim() || "/";
  const url = `https://${domain.replace(/^\./, "")}${path}`;
  await chrome.cookies.set({
    url,
    name,
    value: document.getElementById("newValue").value,
    domain,
    path,
  });
  addModal.classList.remove("show");
  loadCookies();
});

// ═══════════════════════════════════
//  Redirect Tracer
// ═══════════════════════════════════
const redirectChainEl = document.getElementById("redirectChain");
let lastRedirectText = "";

async function loadRedirects() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    redirectChainEl.innerHTML = '<div class="text-center py-10 px-5 text-zinc-600"><div class="text-3xl mb-2.5">&#x1F500;</div><p class="text-sm">No active tab</p></div>';
    return;
  }

  const data = await chrome.runtime.sendMessage({ type: "getRedirects", tabId: tab.id });
  const chain = data.chain || [];
  const finalUrl = data.finalUrl || tab.url;
  const finalStatus = data.finalStatus || 200;

  if (!chain.length) {
    redirectChainEl.innerHTML = renderStep(finalUrl, finalStatus, true, false);
    lastRedirectText = `${finalUrl}\n${finalStatus}: Final destination`;
    return;
  }

  let html = "";
  let text = "";
  chain.forEach((hop) => {
    const label = getRedirectLabel(hop.statusCode);
    html += renderStep(hop.url, hop.statusCode, false, true);
    text += `${hop.url}\n${hop.statusCode}: ${label} to ${hop.redirectUrl}\n\n`;
  });
  html += renderStep(finalUrl, finalStatus, true, false);
  text += `${finalUrl}\n${finalStatus}: Final destination`;

  redirectChainEl.innerHTML = html;
  lastRedirectText = text;
}

function renderStep(url, statusCode, isFinal, hasConnector) {
  const iconClass = isFinal ? (statusCode >= 400 ? "redirect-icon-error" : "redirect-icon-final") : "redirect-icon-redirect";
  const codeClass = statusCode >= 500 ? "code-5xx" : statusCode >= 400 ? "code-4xx" : `code-${statusCode}`;
  const label = isFinal ? "Final destination" : getRedirectLabel(statusCode);
  const arrow = isFinal
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-zinc-300 shrink-0 size-4"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-zinc-400 shrink-0 size-4"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

  return `
    <div class="redirect-step flex gap-3 relative mb-0">
      <div class="flex flex-col items-center">
        <div class="redirect-step-icon ${iconClass} w-9 h-9 shrink-0 rounded-md flex items-center justify-center relative z-[1]">${arrow}</div>
        ${hasConnector ? '<div class="step-connector" style="position:absolute;left:17px;top:36px;width:1px;height:calc(100%);background:rgba(255,255,255,0.1)"></div>' : ''}
      </div>
      <div class="step-content flex-1 min-w-0 pb-3.5">
        <div class="text-sm font-medium break-all leading-snug">${esc(url)}</div>
        <div class="text-[11px] text-zinc-500 mt-0.5"><span class="code font-semibold px-1.5 py-px rounded text-[10px] tabular-nums ${codeClass}">${statusCode}</span> ${esc(label)}</div>
      </div>
    </div>
  `;
}

function getRedirectLabel(code) {
  const labels = { 301: "Permanent redirect", 302: "Temporary redirect (Found)", 303: "See Other", 307: "Temporary redirect", 308: "Permanent redirect" };
  return labels[code] || `Redirect (${code})`;
}

document.getElementById("btnRedirectRefresh").addEventListener("click", () => loadRedirects());

document.getElementById("btnRedirectCopy").addEventListener("click", async () => {
  if (!lastRedirectText) return;
  await navigator.clipboard.writeText(lastRedirectText);
  const btn = document.getElementById("btnRedirectCopy");
  const orig = btn.querySelector("span").textContent;
  btn.querySelector("span").textContent = "Copied!";
  setTimeout(() => { btn.querySelector("span").textContent = orig; }, 1500);
});

// ═══════════════════════════════════
//  Dark Mode
// ═══════════════════════════════════
const darkToggle = document.getElementById("darkToggle");
const darkBrightness = document.getElementById("darkBrightness");
const darkBrightnessVal = document.getElementById("darkBrightnessVal");
const scopeSite = document.getElementById("scopeSite");
const scopeGlobal = document.getElementById("scopeGlobal");

let darkHost = "";
let darkScope = "site";

async function loadDarkMode() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  try { darkHost = new URL(tab.url).hostname; } catch { darkHost = ""; }
  document.getElementById("darkHost").textContent = darkHost ? `Current site: ${darkHost}` : "";

  const siteKey = "darkmode_" + darkHost;
  const data = await chrome.storage.local.get([siteKey, "darkmode_global", "darkmode_brightness"]);

  const brightness = data.darkmode_brightness || 100;
  darkBrightness.value = brightness;
  darkBrightnessVal.textContent = brightness + "%";

  const siteState = data[siteKey];
  const globalState = data.darkmode_global || false;
  const enabled = siteState !== undefined ? siteState : globalState;

  darkToggle.checked = enabled;
  updateDarkStatus(enabled);
}

function updateDarkStatus(on) {
  const el = document.getElementById("darkStatus");
  el.textContent = on ? "ON" : "OFF";
  el.className = on ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
}

async function applyDark() {
  const enabled = darkToggle.checked;
  const brightness = parseInt(darkBrightness.value);
  updateDarkStatus(enabled);

  if (darkScope === "global") {
    await chrome.storage.local.set({ darkmode_global: enabled });
  } else {
    const siteKey = "darkmode_" + darkHost;
    await chrome.storage.local.set({ [siteKey]: enabled });
  }
  await chrome.storage.local.set({ darkmode_brightness: brightness });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: "darkmode_toggle", enabled, brightness }).catch(() => {});
  }
}

darkToggle.addEventListener("change", applyDark);

darkBrightness.addEventListener("input", () => {
  darkBrightnessVal.textContent = darkBrightness.value + "%";
});
darkBrightness.addEventListener("change", applyDark);

function setScopeActive(activeBtn, inactiveBtn) {
  activeBtn.classList.add("scope-active", "border-zinc-100", "text-zinc-100", "bg-zinc-100/10");
  activeBtn.classList.remove("text-zinc-500");
  inactiveBtn.classList.remove("scope-active", "border-zinc-100", "text-zinc-100", "bg-zinc-100/10");
  inactiveBtn.classList.add("text-zinc-500");
}
scopeSite.addEventListener("click", () => { darkScope = "site"; setScopeActive(scopeSite, scopeGlobal); });
scopeGlobal.addEventListener("click", () => { darkScope = "global"; setScopeActive(scopeGlobal, scopeSite); });

// ═══════════════════════════════════
//  X Dim Mode
// ═══════════════════════════════════
const xdimToggle = document.getElementById("xdimToggle");
const xdimPreview = document.getElementById("xdimPreview");
const xdimHueSlider = document.getElementById("xdimHueSlider");
const xdimHueVal = document.getElementById("xdimHueVal");
const xdimCustomHueSection = document.getElementById("xdimCustomHueSection");
const xdimDots = document.querySelectorAll(".xdim-dot");

const XDIM_THEMES = { dim: { hue: 210, sat: 34 }, slate: { hue: 210, sat: 8 }, jade: { hue: 150, sat: 34 }, plum: { hue: 270, sat: 34 }, dusk: { hue: 330, sat: 34 }, ember: { hue: 25, sat: 34 } };
let xdimTheme = "dim";
let xdimCustomHue = 210;

async function loadXDim() {
  const data = await chrome.storage.local.get(["xdim_enabled", "xdim_theme", "xdim_customHue"]);
  const enabled = data.xdim_enabled || false;
  xdimTheme = data.xdim_theme || "dim";
  xdimCustomHue = data.xdim_customHue || 210;

  xdimToggle.checked = enabled;
  xdimHueSlider.value = xdimCustomHue;
  xdimHueVal.textContent = xdimCustomHue + "\u00B0";

  updateXDimStatus(enabled);
  updateXDimThemeDots();
  updateXDimPreview();
}

function updateXDimStatus(on) {
  const el = document.getElementById("xdimStatus");
  el.textContent = on ? "ON" : "OFF";
  el.className = on ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
}

function updateXDimThemeDots() {
  xdimDots.forEach((dot) => { dot.classList.toggle("active", dot.dataset.theme === xdimTheme); });
  xdimCustomHueSection.classList.toggle("show", xdimTheme === "custom");
}

function getXDimHueSat() {
  if (xdimTheme === "custom") return { hue: xdimCustomHue, sat: 34 };
  return XDIM_THEMES[xdimTheme] || XDIM_THEMES.dim;
}

function updateXDimPreview() {
  const { hue: h, sat: s } = getXDimHueSat();
  const bar = xdimPreview.querySelector(".xdim-preview-bar");
  const tweet = xdimPreview.querySelector(".xdim-preview-tweet");
  bar.style.background = `hsl(${h}, ${s}%, 16%)`;
  bar.style.color = `hsl(${h}, ${Math.round(s * 0.32)}%, 60%)`;
  tweet.style.background = `hsl(${h}, ${s}%, 13%)`;
  tweet.style.color = `hsl(${h}, ${Math.round(s * 0.32)}%, 60%)`;
  tweet.style.borderColor = `hsl(${h}, ${Math.round(s * 0.47)}%, 26%)`;
}

xdimToggle.addEventListener("change", async () => {
  const enabled = xdimToggle.checked;
  updateXDimStatus(enabled);
  await chrome.storage.local.set({ xdim_enabled: enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "xdim_toggle", enabled }).catch(() => {});
});

xdimDots.forEach((dot) => {
  dot.addEventListener("click", async () => {
    xdimTheme = dot.dataset.theme;
    updateXDimThemeDots();
    updateXDimPreview();
    await chrome.storage.local.set({ xdim_theme: xdimTheme });
  });
});

xdimHueSlider.addEventListener("input", () => { xdimCustomHue = parseInt(xdimHueSlider.value); xdimHueVal.textContent = xdimCustomHue + "\u00B0"; updateXDimPreview(); });
xdimHueSlider.addEventListener("change", async () => { xdimCustomHue = parseInt(xdimHueSlider.value); await chrome.storage.local.set({ xdim_customHue: xdimCustomHue }); });

// ═══════════════════════════════════
//  Cookie Consent (GDPR)
// ═══════════════════════════════════
const nocookieToggle = document.getElementById("nocookieToggle");

async function loadNoCookie() {
  const data = await chrome.storage.local.get(["nocookie_enabled"]);
  const enabled = data.nocookie_enabled !== false;
  nocookieToggle.checked = enabled;
  updateNoCookieUI(enabled);
}

function updateNoCookieUI(on) {
  const el = document.getElementById("nocookieStatus");
  el.textContent = on ? "ON" : "OFF";
  el.className = on ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
}

nocookieToggle.addEventListener("change", async () => {
  const enabled = nocookieToggle.checked;
  updateNoCookieUI(enabled);
  await chrome.storage.local.set({ nocookie_enabled: enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "nocookie_toggle", enabled }).catch(() => {});
});

// ═══════════════════════════════════
//  Live CSS Editor
// ═══════════════════════════════════
const livecssEditor = document.getElementById("livecssEditor");
const livecssSave = document.getElementById("livecssSave");
const livecssClear = document.getElementById("livecssClear");
let livecssHost = "";

async function loadLiveCSS() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;
  try { livecssHost = new URL(tab.url).hostname; } catch { livecssHost = ""; }
  document.getElementById("livecssHost").textContent = livecssHost ? `Editing CSS for: ${livecssHost}` : "No accessible page";
  const key = "livecss_" + livecssHost;
  const data = await chrome.storage.local.get([key]);
  livecssEditor.value = data[key] || "";
}

livecssEditor.addEventListener("input", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "livecss_update", css: livecssEditor.value }).catch(() => {});
});

livecssEditor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = livecssEditor.selectionStart;
    const end = livecssEditor.selectionEnd;
    livecssEditor.value = livecssEditor.value.substring(0, start) + "  " + livecssEditor.value.substring(end);
    livecssEditor.selectionStart = livecssEditor.selectionEnd = start + 2;
    livecssEditor.dispatchEvent(new Event("input"));
  }
});

livecssSave.addEventListener("click", async () => {
  const key = "livecss_" + livecssHost;
  await chrome.storage.local.set({ [key]: livecssEditor.value });
  livecssSave.textContent = "Saved!";
  setTimeout(() => { livecssSave.textContent = "Save"; }, 1500);
});

livecssClear.addEventListener("click", async () => {
  livecssEditor.value = "";
  const key = "livecss_" + livecssHost;
  await chrome.storage.local.remove(key);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "livecss_update", css: "" }).catch(() => {});
});

// ═══════════════════════════════════
//  YouTube Unhook
// ═══════════════════════════════════
const unhookToggle = document.getElementById("unhookToggle");

async function loadUnhook() {
  const data = await chrome.storage.local.get(["unhook_enabled"]);
  const enabled = data.unhook_enabled !== false;
  unhookToggle.checked = enabled;
  updateUnhookUI(enabled);
}

function updateUnhookUI(on) {
  const el = document.getElementById("unhookStatus");
  el.textContent = on ? "ON" : "OFF";
  el.className = on ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
}

unhookToggle.addEventListener("change", async () => {
  const enabled = unhookToggle.checked;
  updateUnhookUI(enabled);
  await chrome.storage.local.set({ unhook_enabled: enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "unhook_toggle", enabled }).catch(() => {});
});

// ═══════════════════════════════════
//  JavaScript Toggle
// ═══════════════════════════════════
const jsToggle = document.getElementById("jsToggle");
const jsIndicator = document.getElementById("jsIndicator");

let jsHost = "";

async function loadJsToggle() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;
  try { jsHost = new URL(tab.url).hostname; } catch { jsHost = ""; }
  document.getElementById("jsHostLabel").textContent = jsHost || "No accessible page";
  if (!jsHost) return;
  if (!chrome.contentSettings || !chrome.contentSettings.javascript) return;
  const pattern = `https://${jsHost}/*`;
  chrome.contentSettings.javascript.get({ primaryUrl: pattern }, (details) => {
    const enabled = details.setting === "allow";
    jsToggle.checked = enabled;
    updateJsUI(enabled);
  });
}

function updateJsUI(enabled) {
  const el = document.getElementById("jsStatus");
  el.textContent = enabled ? "ENABLED" : "DISABLED";
  el.className = enabled ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
  jsIndicator.className = enabled ? "w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-100" : "w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-500";
}

jsToggle.addEventListener("change", async () => {
  const enabled = jsToggle.checked;
  updateJsUI(enabled);
  if (!chrome.contentSettings || !chrome.contentSettings.javascript) return;
  const pattern = `https://${jsHost}/*`;
  chrome.contentSettings.javascript.set({ primaryPattern: pattern, setting: enabled ? "allow" : "block" });
  chrome.contentSettings.javascript.set({ primaryPattern: `http://${jsHost}/*`, setting: enabled ? "allow" : "block" });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.reload(tab.id);
});

// ═══════════════════════════════════
//  Music Recognizer (ACRCloud)
// ═══════════════════════════════════
let ACR_HOST = "";
let ACR_KEY = "";
let ACR_SECRET = "";

chrome.storage.local.get(["acr_host", "acr_key", "acr_secret"], (data) => {
  ACR_HOST = data.acr_host || "identify-eu-west-1.acrcloud.com";
  ACR_KEY = data.acr_key || "";
  ACR_SECRET = data.acr_secret || "";
});

const listenBtn = document.getElementById("listenBtn");
const listenTimer = document.getElementById("listenTimer");
const listenLabel = document.getElementById("listenLabel");
const musicResult = document.getElementById("musicResult");
const musicHistoryEl = document.getElementById("musicHistory");
let isRecording = false;

listenBtn.addEventListener("click", () => { if (!isRecording) startListening(); });

async function startListening() {
  if (!ACR_KEY || !ACR_SECRET) {
    musicResult.innerHTML = '<div class="text-center py-3 px-3 rounded-lg text-xs bg-zinc-900 inset-ring inset-ring-white/5 text-zinc-400">ACRCloud credentials not set. <a href="https://www.acrcloud.com/sign-up/" target="_blank" class="text-zinc-300 underline">Sign up free</a> and add them below.</div>';
    showAcrConfig();
    return;
  }
  isRecording = true;
  listenBtn.classList.add("recording");
  listenBtn.querySelector(".mic-icon").classList.add("hidden");
  listenBtn.querySelector(".bars-icon").classList.remove("hidden");
  listenBtn.closest(".music-center").classList.add("active");
  listenLabel.textContent = "Listening...";
  musicResult.innerHTML = "";

  let seconds = 10;
  listenTimer.textContent = seconds + "s";
  const interval = setInterval(() => { seconds--; listenTimer.textContent = seconds + "s"; if (seconds <= 0) clearInterval(interval); }, 1000);

  try {
    const stream = await new Promise((resolve, reject) => {
      chrome.tabCapture.capture({ audio: true, video: false }, (s) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!s) return reject(new Error("No audio stream"));
        resolve(s);
      });
    });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(audioCtx.destination);
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const blob = await new Promise((resolve) => {
      recorder.onstop = () => { source.disconnect(); audioCtx.close(); stream.getTracks().forEach((t) => t.stop()); resolve(new Blob(chunks, { type: "audio/webm" })); };
      recorder.start();
      setTimeout(() => recorder.stop(), 10000);
    });
    clearInterval(interval);
    listenTimer.textContent = "";
    listenLabel.textContent = "Identifying...";
    const result = await identifyWithACR(blob);
    showResult(result);
  } catch (err) {
    clearInterval(interval);
    musicResult.innerHTML = `<div class="text-center py-3 px-3 rounded-lg text-xs bg-zinc-900 inset-ring inset-ring-white/5 text-zinc-400">${esc(err.message)}</div>`;
    showAcrConfig();
  } finally {
    isRecording = false;
    listenBtn.classList.remove("recording");
    listenBtn.querySelector(".mic-icon").classList.remove("hidden");
    listenBtn.querySelector(".bars-icon").classList.add("hidden");
    listenBtn.closest(".music-center").classList.remove("active");
    listenTimer.textContent = "";
    listenLabel.textContent = "Tap to listen";
  }
}

async function hmacSha1(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function identifyWithACR(audioBlob) {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `POST\n/v1/identify\n${ACR_KEY}\naudio\n1\n${timestamp}`;
  const signature = await hmacSha1(ACR_SECRET, stringToSign);
  const arrayBuf = await audioBlob.arrayBuffer();
  const form = new FormData();
  form.append("access_key", ACR_KEY);
  form.append("data_type", "audio");
  form.append("signature_version", "1");
  form.append("signature", signature);
  form.append("timestamp", timestamp.toString());
  form.append("sample_bytes", arrayBuf.byteLength.toString());
  form.append("sample", audioBlob, "sample.webm");
  const resp = await fetch(`https://${ACR_HOST}/v1/identify`, { method: "POST", body: form });
  const data = await resp.json();
  if (data.status && data.status.code === 0 && data.metadata) {
    const music = data.metadata.music;
    const humming = data.metadata.humming;
    if (music && music.length > 0) return music[0];
    if (humming && humming.length > 0) return humming[0];
    throw new Error("Song recognized but no match found. Try a clearer part of the track.");
  } else if (data.status && data.status.code === 0) {
    throw new Error("No match found. Try during a clearer part of the song.");
  } else if (data.status && data.status.code === 1001) {
    throw new Error("No music detected. Make sure audio is playing in the tab.");
  } else {
    throw new Error(data.status ? data.status.msg : "Unknown error");
  }
}

function showResult(song) {
  const title = song.title || "Unknown";
  const artist = (song.artists || []).map((a) => a.name).join(", ") || "Unknown";
  const album = song.album ? song.album.name : "";
  const ytQuery = encodeURIComponent(`${title} ${artist}`);
  const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;

  musicResult.innerHTML = `
    <a class="flex items-center gap-3 p-3.5 bg-zinc-900 rounded-lg no-underline text-inherit cursor-pointer inset-ring inset-ring-white/[0.05]" href="${ytUrl}" target="_blank">
      <div class="w-14 h-14 rounded-md bg-zinc-800 flex items-center justify-center text-2xl shrink-0 overflow-hidden">&#x1F3B5;</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-zinc-100 truncate">${esc(title)}</div>
        <div class="text-xs text-zinc-400 mt-0.5 truncate">${esc(artist)}</div>
        ${album ? `<div class="text-[11px] text-zinc-600 mt-0.5 truncate">${esc(album)}</div>` : ""}
      </div>
      <div class="text-zinc-300 text-lg shrink-0">&#x25B6;</div>
    </a>
  `;

  chrome.storage.local.get(["music_history"], (data) => {
    const history = data.music_history || [];
    history.unshift({ title, artist, album, time: Date.now() });
    if (history.length > 20) history.length = 20;
    chrome.storage.local.set({ music_history: history }, loadMusicHistory);
  });
}

document.getElementById("acrSaveBtn").addEventListener("click", () => {
  const host = document.getElementById("acrHost").value.trim();
  const key = document.getElementById("acrKey").value.trim();
  const secret = document.getElementById("acrSecret").value.trim();
  ACR_HOST = host || ACR_HOST;
  ACR_KEY = key;
  ACR_SECRET = secret;
  chrome.storage.local.set({ acr_host: ACR_HOST, acr_key: ACR_KEY, acr_secret: ACR_SECRET });
  document.getElementById("acrSaveBtn").textContent = "Saved!";
  setTimeout(() => { document.getElementById("acrSaveBtn").textContent = "Save"; }, 1500);
});

function showAcrConfig() {
  document.getElementById("acrConfig").style.display = "";
  loadAcrFields();
}

document.getElementById("acrSettingsBtn").addEventListener("click", () => {
  const cfg = document.getElementById("acrConfig");
  if (cfg.style.display === "none") {
    cfg.style.display = "";
    chrome.storage.local.get(["acr_host", "acr_key", "acr_secret"], (data) => {
      document.getElementById("acrHost").value = data.acr_host || "identify-eu-west-1.acrcloud.com";
      document.getElementById("acrKey").value = data.acr_key || "";
      document.getElementById("acrSecret").value = data.acr_secret || "";
    });
  } else {
    cfg.style.display = "none";
  }
});

function loadAcrFields() {
  chrome.storage.local.get(["acr_host", "acr_key", "acr_secret"], (data) => {
    document.getElementById("acrHost").value = data.acr_host || "identify-eu-west-1.acrcloud.com";
    document.getElementById("acrKey").value = data.acr_key || "";
    document.getElementById("acrSecret").value = data.acr_secret || "";
    if (!data.acr_key || !data.acr_secret) showAcrConfig();
    else document.getElementById("acrConfig").style.display = "none";
  });
}

function loadMusicHistory() {
  chrome.storage.local.get(["music_history"], (data) => {
    const history = data.music_history || [];
    if (!history.length) { musicHistoryEl.innerHTML = ""; return; }
    musicHistoryEl.innerHTML = `<div class="flex items-center justify-between mb-1.5"><h2 class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0">Recent</h2><button type="button" id="clearHistory" class="bg-transparent border-none text-zinc-400 text-[11px] cursor-pointer font-medium hover:text-zinc-100">Clear</button></div>` + history.map((h) => {
      const q = encodeURIComponent(`${h.title} ${h.artist}`);
      return `<a class="flex items-center gap-2.5 px-2.5 py-2 bg-zinc-900 rounded-md mb-1 no-underline text-inherit cursor-pointer inset-ring inset-ring-white/[0.03]" href="https://www.youtube.com/results?search_query=${q}" target="_blank">
        <span class="text-xs font-medium text-zinc-400 flex-1 min-w-0 truncate">${esc(h.title)}</span>
        <span class="text-[11px] text-zinc-600 truncate max-w-[100px]">${esc(h.artist)}</span>
        <span class="text-zinc-300 text-xs shrink-0">&#x25B6;</span>
      </a>`;
    }).join("");
    document.getElementById("clearHistory").addEventListener("click", () => { chrome.storage.local.remove("music_history", loadMusicHistory); });
  });
}

// ═══════════════════════════════════
//  Picture-in-Picture
// ═══════════════════════════════════
const pipBtn = document.getElementById("pipBtn");
const pipStatus = document.getElementById("pipStatus");

pipBtn.addEventListener("click", enterPiP);

async function enterPiP() {
  const el = pipStatus;
  el.textContent = "";
  el.className = "pip-status text-xs text-zinc-600 min-h-[18px]";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { el.textContent = "No active tab"; el.classList.add("text-zinc-400"); return; }

  try {
    const result = await chrome.runtime.sendMessage({ type: "pip", tabId: tab.id });
    if (!result) { el.textContent = "Could not access page"; el.classList.add("text-zinc-400"); }
    else if (result.error) { el.textContent = result.error; el.classList.add("text-zinc-400"); }
    else if (result.action === "entered") { el.textContent = "Video in Picture-in-Picture"; el.classList.add("text-zinc-100"); }
    else if (result.action === "exited") { el.textContent = "Exited Picture-in-Picture"; el.classList.add("text-zinc-100"); }
  } catch (err) { el.textContent = err.message; el.classList.add("text-zinc-400"); }
}

// ═══════════════════════════════════
//  JSON Formatter
// ═══════════════════════════════════
const jsonformatToggle = document.getElementById("jsonformatToggle");

async function loadJsonFormat() {
  const data = await chrome.storage.local.get(["jsonformat_enabled"]);
  const enabled = data.jsonformat_enabled !== false;
  jsonformatToggle.checked = enabled;
  updateJsonFormatUI(enabled);
}

function updateJsonFormatUI(on) {
  const el = document.getElementById("jsonformatStatus");
  el.textContent = on ? "ON" : "OFF";
  el.className = on ? "text-sm font-medium text-zinc-100" : "text-sm font-medium text-zinc-500";
}

jsonformatToggle.addEventListener("change", async () => {
  const enabled = jsonformatToggle.checked;
  updateJsonFormatUI(enabled);
  await chrome.storage.local.set({ jsonformat_enabled: enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "jsonformat_toggle", enabled }).catch(() => {});
});

// ═══════════════════════════════════
//  Helpers
// ═══════════════════════════════════
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function escA(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}