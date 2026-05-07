(() => {
  if (window.__verifactInjected) return;
  window.__verifactInjected = true;

  const VERDICT_COLORS = {
    true: "#28a05a", false: "#c83232", misleading: "#c89628", unverified: "#888",
  };

  const ensure = () => {
    let host = document.getElementById("verifact-overlay-host");
    if (host) return host.shadowRoot;
    host = document.createElement("div");
    host.id = "verifact-overlay-host";
    host.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;width:380px;max-height:80vh;font-family:-apple-system,system-ui,sans-serif;";
    const root = host.attachShadow({ mode: "open" });
    document.documentElement.appendChild(host);
    return root;
  };

  const render = (html) => {
    const root = ensure();
    root.innerHTML = `
      <style>
        .card { background: #fff; color: #14202c; border-radius: 14px; box-shadow: 0 20px 60px -10px rgba(0,0,0,.25); overflow:hidden; border: 1px solid #e5e7eb; max-height:80vh; display:flex; flex-direction:column; }
        .head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background: linear-gradient(135deg,#28a05a,#3bb573); color:#fff; }
        .head b { font-size: 14px; }
        .head button { background: rgba(255,255,255,.2); border: 0; color:#fff; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px; }
        .body { padding: 14px; overflow-y:auto; }
        .score { font-size: 28px; font-weight: 700; color:#28a05a; }
        .summary { font-size: 13px; color:#475569; margin-top:6px; line-height:1.5; }
        .claim { margin-top: 12px; padding: 10px; border-radius: 10px; border:1px solid #e5e7eb; background:#fafafa; }
        .badge { display:inline-block; font-size: 10px; font-weight:700; text-transform:uppercase; padding:2px 8px; border-radius:99px; color:#fff; }
        .ctext { font-size: 13px; margin-top:6px; line-height:1.4; }
        .reason { font-size: 11px; color:#64748b; margin-top:4px; }
        .ev { font-size: 11px; margin-top:6px; }
        .ev a { color: #28a05a; text-decoration:none; }
        .spin { width:24px; height:24px; border:3px solid #e5e7eb; border-top-color:#28a05a; border-radius:50%; animation: sp 1s linear infinite; margin: 30px auto; }
        @keyframes sp { to { transform: rotate(360deg); } }
        .quote { font-size:11px; color:#64748b; font-style:italic; border-left:2px solid #28a05a; padding-left:8px; margin-bottom: 10px; }
      </style>
      <div class="card">${html}</div>
    `;
    const closeBtn = root.querySelector("#vf-close");
    if (closeBtn) closeBtn.onclick = () => document.getElementById("verifact-overlay-host")?.remove();
  };

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "verifact:loading") {
      render(`
        <div class="head"><b>Verifact</b><button id="vf-close">Close</button></div>
        <div class="body">
          <div class="quote">${escapeHtml(msg.text.slice(0, 200))}${msg.text.length > 200 ? "…" : ""}</div>
          <div class="spin"></div>
          <div style="text-align:center;font-size:12px;color:#64748b">Verifying claims…</div>
        </div>
      `);
    } else if (msg.type === "verifact:result") {
      const d = msg.data || {};
      if (d.error) { render(errorCard(d.error)); return; }
      const claimsHtml = (d.claims || []).map((c) => `
        <div class="claim">
          <span class="badge" style="background:${VERDICT_COLORS[c.verdict] || "#888"}">${c.verdict}</span>
          <div class="ctext">${escapeHtml(c.claim)}</div>
          <div class="reason">${escapeHtml(c.reasoning || "")}</div>
          ${(c.evidence || []).slice(0,2).map((e) => `<div class="ev">→ <a href="${escapeAttr(e.url)}" target="_blank">${escapeHtml(e.title)}</a></div>`).join("")}
        </div>
      `).join("");
      render(`
        <div class="head"><b>Verifact</b><button id="vf-close">Close</button></div>
        <div class="body">
          <div class="score">${d.credibility_score ?? "–"}<span style="font-size:14px;color:#94a3b8">/100</span></div>
          <div class="summary">${escapeHtml(d.summary || "")}</div>
          ${claimsHtml}
        </div>
      `);
    } else if (msg.type === "verifact:error") {
      render(errorCard(msg.message));
    }
  });

  function errorCard(m) {
    return `<div class="head"><b>Verifact</b><button id="vf-close">Close</button></div><div class="body"><div style="color:#c83232;font-size:13px">${escapeHtml(m)}</div></div>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }
})();
