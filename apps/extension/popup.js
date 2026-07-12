const LOCAL_SERVER = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const passengerSelect = document.getElementById('passengerSelect');
  const autofillBtn = document.getElementById('autofillBtn');
  const statusMsg = document.getElementById('statusMsg');
  const statusDot = document.getElementById('statusDot');
  const openVaultBtn = document.getElementById('openVaultBtn');

  // Open Web Vault Dashboard in new tab
  openVaultBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: LOCAL_SERVER });
  });

  // Load passengers from Next.js server
  try {
    const res = await fetch(`${LOCAL_SERVER}/api/passengers`);
    if (!res.ok) throw new Error('Could not connect to database.');
    
    const passengers = await res.json();
    passengerSelect.innerHTML = '';
    
    if (passengers.length === 0) {
      passengerSelect.innerHTML = '<option value="">No profiles found</option>';
      statusMsg.textContent = 'Add a profile in the Web Dashboard.';
      statusDot.className = 'status-dot warning';
      return;
    }

    passengers.forEach((p) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      passengerSelect.appendChild(option);
    });

    autofillBtn.disabled = false;
    statusMsg.textContent = 'Ready to autofill';
    statusDot.className = 'status-dot active';
  } catch (error) {
    console.error(error);
    passengerSelect.innerHTML = '<option value="">Offline</option>';
    statusDot.className = 'status-dot error';
    statusMsg.textContent = 'Local App not running';
  }

  // Handle autofill action
  autofillBtn.addEventListener('click', async () => {
    const passengerId = passengerSelect.value;
    if (!passengerId) return;

    statusMsg.textContent = 'Analyzing booking form...';
    statusDot.className = 'status-dot warning';
    autofillBtn.disabled = true;

    try {
      // 1. Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        throw new Error('No active booking tab found.');
      }

      // 2. Fetch selectors and values from local Next.js server
      const res = await fetch(`${LOCAL_SERVER}/api/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url, passengerId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch matching fields.');
      }

      const { fields } = await res.json();
      if (!fields || fields.length === 0) {
        statusDot.className = 'status-dot error';
        statusMsg.textContent = 'No matching fields for this website';
        autofillBtn.disabled = false;
        return;
      }

      // 3. Inject scripts into the active tab to autofill values
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: fillFormFields,
        args: [fields]
      });

      statusDot.className = 'status-dot active';
      statusMsg.textContent = `Autofilled ${fields.length} fields successfully!`;
    } catch (err) {
      statusDot.className = 'status-dot error';
      statusMsg.textContent = err.message || 'Autofill failed';
    } finally {
      autofillBtn.disabled = false;
    }
  });
});

/**
 * Script executed inside the active booking page tab
 */
function fillFormFields(fields) {
  let count = 0;
  fields.forEach(({ selector, value, type }) => {
    const element = document.querySelector(selector);
    if (element) {
      // Handle HTML select dropdowns
      if (type === 'select' || element.tagName === 'SELECT') {
        element.value = value;
        // Trigger both change and input events so framework bindings (Angular/React) update
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // Handle input fields
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      count++;
    }
  });
  console.log(`[TravelVault] Autofilled ${count} elements on the page.`);
}
