console.log("Content script loaded in Gmail tab");

function getEmailBody(signatureDelimiter) {
  const selector = "div[aria-label='Message Body'], div[aria-label='Message text'], div.editable";
  const element = document.querySelector(selector);
  if (element) {
    let emailText = element.innerHTML;
    if (signatureDelimiter && emailText.includes(signatureDelimiter)) {
      emailText = emailText.substring(0, emailText.indexOf(signatureDelimiter)).trim();
    }
    return emailText;
  }

  return null;
}

function sendToChatGPT(text, styles, apiKey) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "sendToChatGPT",
        text,
        styles,
        apiKey
      },
      response => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(response ? response.error : 'No response');
        }
      }
    );
  });
}

function displaySuggestions(suggestions, signatureDelimiter) {
  const selector = "div[aria-label='Message Body'], div[aria-label='Message text'], div.editable";
  const element = document.querySelector(selector);
  if (element) {
    let newText = suggestions.trim();
    newText = newText.replace(/\n/g, '<br>');
    if (signatureDelimiter) {
      const signatureIndex = element.innerHTML.indexOf(signatureDelimiter);
      if (signatureIndex !== -1) {
        const signature = element.innerHTML.substring(signatureIndex);
        newText = newText + '<br><br>' + signature;
      }
    }

    if (element.getAttribute('contenteditable') === 'true') {
      element.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertHTML', false, newText);
    } else {
      element.innerHTML = newText;
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reviewEmail") {
    const selectedStyles = request.styles;

    chrome.storage.sync.get(["apiKey", "signatureDelimiter"], result => {
      if (result.apiKey) {
        const emailBody = getEmailBody(result.signatureDelimiter);
        if (emailBody) {
          sendToChatGPT(emailBody, selectedStyles, result.apiKey)
            .then(data => {
              if (data.choices && data.choices.length > 0) {
                displaySuggestions(data.choices[0].message.content, result.signatureDelimiter);
                sendResponse({ success: true });
              } else {
                console.log("No suggestions received");
                sendResponse({ success: false, error: "No suggestions received" });
              }
            })
            .catch(error => {
              console.error("Error:", error);
              sendResponse({ success: false, error });
            });
        } else {
          alert("Could not retrieve the email body. Please make sure you're composing an email.");
          sendResponse({ success: false, error: "Email body not found" });
        }
      } else {
        alert("Please enter and save your API key in the extension settings.");
        sendResponse({ success: false, error: "API key not set" });
      }
    });

    return true; // Indicates that we will send a response asynchronously
  }
});
