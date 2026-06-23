/**
 * Context: Browser Extension Popup Script
 * Description: Manages styling toolbars, counting metrics, rich document DOM commands,
 * and data persistence hooks for full contextual CRUD handling. Includes active timestamps.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const noteEditor = document.getElementById('note-editor');
  const saveBtn = document.getElementById('save-btn');
  const exportBtn = document.getElementById('export-btn');
  const clearBtn = document.getElementById('clear-btn');
  const pageTitleDisplay = document.getElementById('page-title');
  const toastNotification = document.getElementById('toast-notification');
  const counterDisplay = document.getElementById('counter-display');
  const charCounter = document.getElementById('char-counter');
  
  // Custom Styles references
  const bgColorPicker = document.getElementById('bg-color');
  const textColorPicker = document.getElementById('text-color');

  // 1. Hook up formatting command styling properties
  document.getElementById('bold-btn').addEventListener('click', () => document.execCommand('bold', false, null));
  document.getElementById('italic-btn').addEventListener('click', () => document.execCommand('italic', false, null));
  document.getElementById('underline-btn').addEventListener('click', () => document.execCommand('underline', false, null));

  // Dynamic customization preview listeners
  bgColorPicker.addEventListener('input', (e) => noteEditor.style.backgroundColor = e.target.value);
  textColorPicker.addEventListener('input', (e) => noteEditor.style.color = e.target.value);

  // Character monitoring listener
  noteEditor.addEventListener('input', () => {
    updateCharCount();
  });

  function updateCharCount() {
    charCounter.textContent = `Characters: ${noteEditor.innerText.trim().length}`;
  }

  // Helper to generate a clean timestamp string
  function getTimestampString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `\n\n[Last Saved: ${year}-${month}-${day} ${hours}:${minutes}]\n`;
  }

  // 2. Query target tab variables using advanced extension runtime environments
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    pageTitleDisplay.textContent = "Unavailable on this page.";
    noteEditor.removeAttribute('contenteditable');
    return;
  }

  const currentUrl = tab.url;
  pageTitleDisplay.textContent = `Target: ${tab.title || currentUrl}`;

  // 3. Read contextual configuration arrays from chrome.storage
  chrome.storage.local.get([currentUrl, 'totalSaves'], (result) => {
    if (result[currentUrl]) {
      const data = result[currentUrl];
      noteEditor.innerHTML = data.html || '';
      noteEditor.style.backgroundColor = data.bg || '#ffffff';
      noteEditor.style.color = data.text || '#333333';
      bgColorPicker.value = data.bg || '#ffffff';
      textColorPicker.value = data.text || '#333333';
    }
    updateCharCount();
    const saves = result.totalSaves || 0;
    counterDisplay.textContent = `Total lifetime notes saved across sessions: ${saves}`;
  });

  // 4. Create and Update (CRUD) data operations block
  saveBtn.addEventListener('click', () => {
    // Clean out old timestamps before appending the fresh one
    let baseText = noteEditor.innerHTML;
    baseText = baseText.replace(/<div class="timestamp-line">.*?<\/div>/g, "");
    baseText = baseText.replace(/\[Last Saved:.*?\]/g, "");

    const stampedTime = getTimestampString();
    
    // Set timestamp lines securely inside an independent wrapper block
    noteEditor.innerHTML = baseText + `<div class="timestamp-line" style="font-size:11px; color:#7f8c8d; margin-top:8px;" contenteditable="false">${stampedTime}</div>`;

    const noteData = {
      html: noteEditor.innerHTML,
      bg: bgColorPicker.value,
      text: textColorPicker.value
    };
    
    chrome.storage.local.set({ [currentUrl]: noteData }, () => {
      showToast();
      updateCharCount();
      
      chrome.runtime.sendMessage({ action: "noteSaved" }, (response) => {
        if (response && response.newCount !== undefined) {
          counterDisplay.textContent = `Total lifetime notes saved across sessions: ${response.newCount}`;
        }
      });
    });
  });

  // Export feature operation
  exportBtn.addEventListener('click', () => {
    const textContent = noteEditor.innerText.trim();
    if (!textContent) {
      return;
    }
    
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QuickNote_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // 5. Delete (CRUD) data cleanup block
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.remove([currentUrl], () => {
      noteEditor.innerHTML = '';
      noteEditor.style.backgroundColor = '#ffffff';
      noteEditor.style.color = '#333333';
      bgColorPicker.value = '#ffffff';
      textColorPicker.value = '#333333';
      updateCharCount();
    });
  });

  // Visual success notification controller
  function showToast() {
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2000);
  }
});