console.log("Background script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

  if (message.action === "sendToChatGPT") {
    const { text, styles, apiKey } = message;

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [{
          "role": "user",
          "content": `Review and provide suggestions for the following email draft combining the following styles or only a single style if only one is provided: ${styles.join(', ')}. Please return only the revised email text without suggesting a subject. Email draft: ${text}`
        }],
        model: "gpt-3.5-turbo",
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.8
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Data received from API:", data);
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error("Fetch error:", error);
      sendResponse({ success: false, error: error.message });
    });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  } else {
    console.warn("Unknown action:", message.action);
  }
});
