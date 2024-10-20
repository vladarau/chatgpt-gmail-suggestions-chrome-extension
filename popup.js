console.log("Popup script loaded");

const apiKeyInput = document.getElementById('apiKeyInput');
const signatureDelimiterInput = document.getElementById('signatureDelimiter');
const editApiKeyButton = document.getElementById('editApiKeyButton');
const saveButton = document.getElementById('saveButton');

saveButton.addEventListener("click", () => {
  const apiKey = apiKeyInput.value;
  const signatureDelimiter = signatureDelimiterInput.value;
  chrome.storage.sync.set({ apiKey, signatureDelimiter }, () => {
    alert("API key and signature delimiter saved.");
    apiKeyInput.readOnly = true;
    apiKeyInput.type = 'password';
  });
});

document.getElementById("reviewButton").addEventListener("click", () => {
  const selectedStyles = Array.from(
    document.querySelectorAll('input[name="style"]:checked')
  ).map(input => input.value);

  // Query tabs with Gmail URL
  chrome.tabs.query({ url: "*://mail.google.com/*" }, tabs => {
    if (tabs.length > 0) {
      // Find the active Gmail tab or default to the first one
      const activeTab = tabs.find(tab => tab.active) || tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: "reviewEmail", styles: selectedStyles });
    } else {
      alert("Please open Gmail and select the draft you want to review.");
    }
  });
});

chrome.storage.sync.get(["apiKey", "signatureDelimiter"], result => {
  apiKeyInput.value = result.apiKey || '';

  if (result.signatureDelimiter) {
    signatureDelimiterInput.value = result.signatureDelimiter;
  }
});

editApiKeyButton.addEventListener('click', () => {
  apiKeyInput.readOnly = false;
  apiKeyInput.type = 'text';
  apiKeyInput.focus();
});
