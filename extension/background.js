const SUPABASE_URL = "https://xxaghjkwzgpdofsweegq.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YWdoamt3emdwZG9mc3dlZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDkzOTQsImV4cCI6MjA5MzY4NTM5NH0.wmyDXFtJ4kSbjoOnqKiEW90XtecivBA6AZecxknOC5w";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verifact-check",
    title: "Verify with Verifact",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "verifact-check" || !info.selectionText || !tab?.id) return;
  const text = info.selectionText.trim();
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["overlay.js"] });
  chrome.tabs.sendMessage(tab.id, { type: "verifact:loading", text });

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    chrome.tabs.sendMessage(tab.id, { type: "verifact:result", data });
  } catch (e) {
    chrome.tabs.sendMessage(tab.id, { type: "verifact:error", message: String(e) });
  }
});
