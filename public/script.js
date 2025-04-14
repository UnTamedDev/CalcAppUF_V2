// --- FILE: public/script.js (FULL FILE - Implementing Iframe Print) ---

// Global variables
let pricingData = null;
let styleMap = {};
let allStyles = [];
let currentStep = 1;
let sectionCounter = 0;

// --- DOM Element References ---
let wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, toggleExampleBtn, exampleImageDiv, printButtonContainer, themeToggleBtn;

// --- Theme Handling ---
const K_THEME = 'nuDoorsEstimatorTheme';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.dataset.theme = 'dark';
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙';
        localStorage.setItem(K_THEME, 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️';
        localStorage.setItem(K_THEME, 'light');
    }
    console.log(`[Client] Theme applied: ${theme}`);
}

function handleThemeToggle() {
    const currentTheme = document.body.dataset.theme;
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(K_THEME) || 'light';
    themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn');
    applyTheme(savedTheme);
}
// --- End Theme Handling ---


/** Build style list and optionally a map */
function processPricingData(data) {
    const list = [];
    const map = {};
    if (!data || !Array.isArray(data.doorPricingGroups)) {
        console.error("[Client] Invalid pricing data received:", data);
        return { map: {}, list: [] };
    }
    for (const group of data.doorPricingGroups) {
        if (!group || !Array.isArray(group.styles)) continue;
        for (const style of group.styles) {
             if (typeof style === 'string' && !list.includes(style)) {
                list.push(style);
                map[style] = { Painted: group.Painted, Primed: group.Primed, Unfinished: group.Unfinished };
            }
        }
    }
    return { map, list: list.sort() };
}

/** Populate style dropdowns */
function populateStyleDropdowns(container) {
    const doorSelect = container.querySelector('select[name="sectionDoorStyle"]');
    const drawerSelect = container.querySelector('select[name="sectionDrawerStyle"]');
    if (!doorSelect || !drawerSelect) { console.warn("[Client] Could not find style select elements:", container); return; }
    if (allStyles.length === 0) { console.warn("[Client] No styles available."); doorSelect.innerHTML = '<option value="">Error</option>'; drawerSelect.innerHTML = '<option value="">Error</option>'; return; }
    const optionsHtml = allStyles.map(style => `<option value="${style}">${style}</option>`).join('');
    doorSelect.innerHTML = optionsHtml; drawerSelect.innerHTML = optionsHtml;
    if (allStyles.length > 0) { doorSelect.value = allStyles[0]; drawerSelect.value = allStyles[0]; }
}

/** Fetch pricing data */
async function initPricingData() {
    try {
        console.log('[Client] Fetching pricing data for styles...');
        const res = await fetch('/data/pricingData.json');
        if (!res.ok) { throw new Error(`HTTP error! status: ${res.status} while fetching pricing data.`); }
        pricingData = await res.json();
        if (!pricingData || !pricingData.doorPricingGroups) { throw new Error('Fetched pricing data is invalid or missing doorPricingGroups.'); }
        const { map, list } = processPricingData(pricingData);
        styleMap = map; allStyles = list;
        console.log('[Client] Pricing data loaded. Styles available:', allStyles.length);
        initializeSections(); initializeWizard();
    } catch (e) {
        console.error('[Client] Failed to load or process pricing data:', e);
        displayError("Could not load essential configuration data. Please try refreshing.");
        if (calculateBtn) calculateBtn.disabled = true;
    }
}

/** Create HTML structure for a single section */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section'; sectionDiv.dataset.index = index;
    const sectionIdPrefix = `section-${index}-`;
    sectionDiv.innerHTML = `
      <div class="section-header">
        <span class="section-id">Section ${index + 1}</span>
        <button type="button" class="remove-button" data-remove-index="${index}" title="Remove Section ${index + 1}">×</button>
      </div>
      <label for="${sectionIdPrefix}doorStyle">Door Style:</label><select name="sectionDoorStyle" id="${sectionIdPrefix}doorStyle" required></select>
      <label for="${sectionIdPrefix}drawerStyle">Drawer Style:</label><select name="sectionDrawerStyle" id="${sectionIdPrefix}drawerStyle" required></select>
      <label for="${sectionIdPrefix}finish">Finish:</label>
      <select name="sectionFinish" id="${sectionIdPrefix}finish" required>
        <option value="Painted" selected>Painted (Standard Colors)</option>
        <option value="Accessible Beige 7036">Accessible Beige 7036</option>
        <option value="Card Room Green No.79">Card Room Green No.79</option>
        <option value="BM White Dove OC-17">BM White Dove OC-17</option>
        <option value="Kendall Charcoal HC-166">Kendall Charcoal HC-166</option>
        <option value="Van Deusen Blue">Van Deusen Blue</option>
        <option value="Stock White/ Decorator's White">Stock White/ Decorator's White</option>
        <option value="Custom Color">Custom Color (Match Fee May Apply)</option>
        <option value="Primed">Primed</option>
        <option value="Unfinished">Unfinished</option>
      </select>
      <div class="dimension-inputs">
        <label for="${sectionIdPrefix}height">Height (in):</label><input type="number" name="sectionHeight" id="${sectionIdPrefix}height" value="12" min="1" step="0.01" required inputmode="decimal" />
        <label for="${sectionIdPrefix}width">Width (in):</label><input type="number" name="sectionWidth" id="${sectionIdPrefix}width" value="12" min="1" step="0.01" required inputmode="decimal" />
      </div>`;
    populateStyleDropdowns(sectionDiv); return sectionDiv;
}

/** Add a new section */
function handleAddSection() { console.log(`[Client] Adding section ${sectionCounter + 1}`); const newSection = createRoughEstimateSection(sectionCounter); sectionsContainer.appendChild(newSection); sectionCounter++; updateSectionNumbers(); }

/** Remove a section */
function handleRemoveSection(event) { const removeButton = event.target.closest('.remove-button'); if (removeButton) { const sectionToRemove = removeButton.closest('.section'); if (sectionToRemove) { const indexToRemove = sectionToRemove.dataset.index; console.log(`[Client] Removing section with index ${indexToRemove}`); sectionToRemove.remove(); updateSectionNumbers(); } } }

/** Update section numbers */
function updateSectionNumbers() { const remainingSections = sectionsContainer.querySelectorAll('.section'); remainingSections.forEach((section, i) => { const idSpan = section.querySelector('.section-id'); const removeBtn = section.querySelector('.remove-button'); const index = i; if (idSpan) idSpan.textContent = `Section ${index + 1}`; section.dataset.index = index; section.querySelectorAll('[id^="section-"]').forEach(el => { const oldId = el.id; const namePart = oldId.substring(oldId.lastIndexOf('-') + 1); const newId = `section-${index}-${namePart}`; el.id = newId; const label = section.querySelector(`label[for="${oldId}"]`); if(label) label.setAttribute('for', newId); }); if (removeBtn) { removeBtn.dataset.removeIndex = index; removeBtn.title = `Remove Section ${index + 1}`; } }); sectionCounter = remainingSections.length; console.log('[Client] Section count updated to:', sectionCounter); const removeButtons = sectionsContainer.querySelectorAll('.remove-button'); removeButtons.forEach(btn => btn.disabled = (remainingSections.length <= 1)); }

/** Wizard Navigation Logic */
function navigateWizard(direction) { const currentStepElement = wizard.querySelector(`.wizard-step.active`); if (!currentStepElement) { console.error('[Client] Cannot navigate, active step not found.'); return; } const targetStepNum = direction === 'next' ? currentStep + 1 : currentStep - 1; if (direction === 'next' && currentStep === 1 && !validateStep1()) { return; } if (direction === 'next' && currentStep === 2 && !validateStep2()) { return; } if (targetStepNum < 1 || targetStepNum > steps.length) { console.warn('[Client] Navigation attempt out of bounds.'); return; } const targetStepElement = wizard.querySelector(`#step-${targetStepNum}`); if (targetStepElement) { currentStepElement.classList.add('hiding'); currentStepElement.classList.remove('active'); setTimeout(() => { currentStepElement.classList.remove('hiding'); }, 400); targetStepElement.classList.add('active'); currentStep = targetStepNum; console.log(`[Client] Navigated to step ${currentStep}`); wizard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else { console.error(`[Client] Wizard step element not found for target step ${targetStepNum}`); } }

// --- Input Validation Functions ---
function validateStep1() { let isValid = true; const sectionElements = sectionsContainer.querySelectorAll('.section'); if (sectionElements.length === 0) { alert("Please add at least one section."); isValid = false; return isValid; } sectionElements.forEach((sectionEl) => { const heightInput = sectionEl.querySelector('[name="sectionHeight"]'); const widthInput = sectionEl.querySelector('[name="sectionWidth"]'); const height = parseFloat(heightInput.value); const width = parseFloat(widthInput.value); heightInput.style.border = ''; widthInput.style.border = ''; if (isNaN(height) || height <= 0) { heightInput.style.border = '2px solid red'; isValid = false; } if (isNaN(width) || width <= 0) { widthInput.style.border = '2px solid red'; isValid = false; } }); if (!isValid) { alert("Please ensure all section dimensions (Height and Width) are numbers greater than 0."); } return isValid; }
function validateStep2() { let isValid = true; const step2Inputs = document.querySelectorAll('#step-2 input[type="number"]'); step2Inputs.forEach(input => { const value = parseInt(input.value, 10); input.style.border = ''; if (isNaN(value) || value < 0) { input.style.border = '2px solid red'; isValid = false; } }); if (!isValid) { alert("Please ensure all piece counts are whole numbers (0 or greater)."); } return isValid; }
function validateStep3() { let isValid = true; const customPaintInput = document.querySelector('#step-3 input[name="customPaintQty"]'); const value = parseInt(customPaintInput.value, 10); customPaintInput.style.border = ''; if (isNaN(value) || value < 0) { customPaintInput.style.border = '2px solid red'; isValid = false; alert("Please ensure Custom Paint Quantity is a whole number (0 or greater)."); } return isValid; }

/** Gather data */
function gatherFormData() { const formData = { sections: [], part2: {}, part3: {} }; const sectionElements = sectionsContainer.querySelectorAll('.section'); sectionElements.forEach((sectionEl, index) => { const sectionData = { doorStyle: sectionEl.querySelector('[name="sectionDoorStyle"]').value, drawerStyle: sectionEl.querySelector('[name="sectionDrawerStyle"]').value, finish: sectionEl.querySelector('[name="sectionFinish"]').value, height: sectionEl.querySelector('[name="sectionHeight"]').value, width: sectionEl.querySelector('[name="sectionWidth"]').value }; formData.sections.push(sectionData); }); const step2Container = document.getElementById('step-2'); if (step2Container) { formData.part2.numDrawers = step2Container.querySelector('#numDrawers')?.value ?? '0'; formData.part2.doors_0_36 = step2Container.querySelector('#doors_0_36')?.value ?? '0'; formData.part2.doors_36_60 = step2Container.querySelector('#doors_36_60')?.value ?? '0'; formData.part2.doors_60_82 = step2Container.querySelector('#doors_60_82')?.value ?? '0'; formData.part2.lazySusanQty = step2Container.querySelector('#lazySusanQty')?.value ?? '0'; } else { console.warn("[Client] Step 2 container not found."); } const step3Container = document.getElementById('step-3'); if (step3Container) { formData.part3.customPaintQty = step3Container.querySelector('#customPaintQty')?.value ?? '0'; } else { console.warn("[Client] Step 3 container not found."); } return formData; }

/** Handle calculation */
async function handleCalculate() { console.log('[Client] Calculate button clicked.'); if (!validateStep1() || !validateStep2() || !validateStep3()) { alert("Please correct the errors in the form before calculating."); return; } calculateBtn.disabled = true; calculateBtn.textContent = 'Calculating...'; resultsDiv.innerHTML = '<div class="invoice-loading"><p>Generating estimate...</p></div>'; navigateWizard('next'); const payload = gatherFormData(); console.log('[Client] Sending payload:', JSON.stringify(payload, null, 2)); try { const response = await fetch('/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload), }); const responseData = await response.json(); if (!response.ok) { const errorMessage = responseData?.message || responseData?.error || `API Error (${response.status})`; throw new Error(errorMessage); } console.log('[Client] Received calculation results:', responseData); displayResults(responseData); } catch (error) { console.error('[Client] Error during calculation request:', error); displayError(`Calculation Failed: ${error.message}`); if (currentStep === 4) navigateWizard('prev'); } finally { calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate'; } }

/** Format currency */
const formatCurrency = (value) => { const number = Number(value); if (isNaN(number)) { console.warn(`[Client] Invalid value passed to formatCurrency: ${value}`); return '$0.00'; } return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); };

/** Display error */
function displayError(message) { resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong> ${message}</p></div>`; if (currentStep !== 4) { const currentActive = wizard.querySelector('.wizard-step.active'); const resultsStep = wizard.querySelector('#step-4'); if (currentActive && resultsStep && currentActive !== resultsStep) { currentActive.classList.remove('active', 'hiding'); resultsStep.classList.add('active'); currentStep = 4; } } if(printButtonContainer) printButtonContainer.style.display = 'none'; }

/** Display calculation results */
function displayResults(data) {
    console.log("[Client] displayResults starting. Target element should be:", resultsDiv);
    if (!resultsDiv) { console.error("[Client] CRITICAL: resultsDiv element is null!"); return; }
    console.log("[Client] displayResults received data:", data);
    if (!data || typeof data !== 'object') { console.error("[Client] Invalid results data received:", data); displayError('Received invalid results data from the server.'); return; }
    const { overallTotal = 0, doorCostTotal = 0, hingeCost = 0, hingeCount = 0, lazySusanCost = 0, specialFeatures = {}, sections = [], part2 = {}, part3 = {} } = data;
    const customPaintCost = specialFeatures?.customPaintCost || 0;
    let sectionsHtml = `<h3>Section Breakdown</h3>`;
    if (sections.length > 0) {
        sectionsHtml += `<table class="details-table"><thead><tr><th>#</th><th>Door Style</th><th>Drawer Style</th><th>Finish</th><th>HxW (in)</th><th>Area (sqft)</th><th>Cost</th></tr></thead><tbody>`;
        sections.forEach((s, i) => {
            const drawerStyleText = (s.drawerStyle && s.drawerStyle !== s.doorStyle) ? s.drawerStyle : '-';
            sectionsHtml += `<tr class="primary-info-row"><td data-label="#">${i + 1}</td><td data-label="Door Style">${s.doorStyle || 'N/A'}</td><td data-label="Drawer Style">${drawerStyleText}</td><td data-label="Finish">${s.finish || 'N/A'}</td><td data-label="HxW (in)">${s.height || 0}" x ${s.width || 0}"</td><td data-label="Area (sqft)">${s.area?.toFixed(2) || 'N/A'}</td><td data-label="Cost">${formatCurrency(s.totalSectionCost)}</td></tr>`;
        });
        sectionsHtml += `</tbody></table>`;
    } else { sectionsHtml += `<p style="text-align: center; color: #666;">No sections were entered.</p>`; }
    let countsHtml = `<h3 style="margin-top: 1.5em;">Counts & Features Summary</h3><table class="details-table"><tbody><tr><td data-label="Doors 0-36" Qty">Doors 0-36" Qty</td><td data-label-value>${part2.doors_0_36 || 0}</td></tr><tr><td data-label="Doors 36-60" Qty">Doors 36-60" Qty</td><td data-label-value>${part2.doors_36_60 || 0}</td></tr><tr><td data-label="Doors 60-82" Qty">Doors 60-82" Qty</td><td data-label-value>${part2.doors_60_82 || 0}</td></tr><tr><td data-label="Total Drawers">Total Drawers</td><td data-label-value>${part2.numDrawers || 0}</td></tr><tr><td data-label="Lazy Susans">Lazy Susans</td><td data-label-value>${part2.lazySusanQty || 0}</td></tr><tr><td data-label="Custom Paint Colors">Custom Paint Colors</td><td data-label-value>${part3.customPaintQty || 0}</td></tr><tr><td data-label="Total Hinges Needed"><b>Total Hinges Needed</b></td><td data-label-value><b>${hingeCount}</b></td></tr></tbody></table>`; // Added data-labels to counts table too
    let costSummaryHtml = `<h3 style="margin-top: 1.5em;">Cost Summary</h3><table class="summary-table"><tbody><tr><td class="table-label" data-label="Door & Drawer Section Cost">Door & Drawer Section Cost</td><td class="table-value">${formatCurrency(doorCostTotal)}</td></tr><tr><td class="table-label" data-label="Hinge Boring Cost">Hinge Boring Cost</td><td class="table-value">${formatCurrency(hingeCost)}</td></tr>`;
    if (lazySusanCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Lazy Susan Cost">Lazy Susan Cost</td><td class="table-value">${formatCurrency(lazySusanCost)}</td></tr>`;
    if (customPaintCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Custom Paint Fee">Custom Paint Fee</td><td class="table-value">${formatCurrency(customPaintCost)}</td></tr>`;
    costSummaryHtml += `</tbody><tfoot><tr class="total-row"><td class="table-label">Estimated Total</td><td class="table-value">${formatCurrency(overallTotal)}</td></tr></tfoot></table>`;
    const finalHtml = `<div class="invoice"><div class="invoice-header"><h1>Estimate Summary</h1><p>Thank you for using the nuDoors Estimator!</p><p>Estimate ID: ${Date.now()}</p></div>${sectionsHtml}${countsHtml}${costSummaryHtml}<div class="estimate-footer"><p>This is an estimate only... Tax not included.</p></div></div>`;
    console.log("[Client] About to set innerHTML for resultsDiv.");
    resultsDiv.innerHTML = finalHtml;
    console.log("[Client] Finished setting innerHTML. resultsDiv parent:", resultsDiv.parentElement);
    console.log("[Client] Is resultsDiv still connected to document?", document.body.contains(resultsDiv));
    if (printButtonContainer) printButtonContainer.style.display = 'block';
}

/** Toggle example image */
function handleToggleExample() { if (!exampleImageDiv || !toggleExampleBtn) return; const isHidden = exampleImageDiv.style.display === 'none'; exampleImageDiv.style.display = isHidden ? 'block' : 'none'; toggleExampleBtn.textContent = isHidden ? 'Hide Example Image' : 'Show Example Image'; }

/** Reset form */
function handleStartOver() { console.log('[Client] Starting over.'); document.querySelectorAll('#step-1 input, #step-1 select, #step-2 input, #step-3 input').forEach(input => { if (input.type === 'number') { input.value = input.name === 'sectionHeight' || input.name === 'sectionWidth' ? '12' : '0'; } else if (input.tagName === 'SELECT') { input.selectedIndex = 0; } input.style.border = ''; }); sectionsContainer.innerHTML = ''; sectionCounter = 0; initializeSections(); resultsDiv.innerHTML = ''; if(printButtonContainer) printButtonContainer.style.display = 'none'; const currentActive = wizard.querySelector('.wizard-step.active'); const firstStep = wizard.querySelector('#step-1'); if (currentActive && firstStep && currentActive !== firstStep) { currentActive.classList.remove('active'); firstStep.classList.add('active'); } currentStep = 1; if (calculateBtn) { calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate'; } window.scrollTo({ top: 0, behavior: 'smooth' }); }

/** Init sections */
function initializeSections() { sectionsContainer.innerHTML = ''; sectionCounter = 0; if (allStyles.length > 0) { handleAddSection(); } else { console.warn('[Client] Cannot initialize sections, styles not loaded.'); sectionsContainer.innerHTML = '<p class="invoice-loading">Loading styles...</p>'; } updateSectionNumbers(); }


// --- NEW IFRAME PRINT HANDLER ---
/** Handles printing using an iframe */
function handlePrintRequest() {
    console.log('[Client] Print button clicked. Using iframe method...');
    const invoiceElement = document.querySelector('#results .invoice'); // Target the specific invoice div

    if (!invoiceElement) {
        console.error("Cannot print: Invoice element not found.");
        alert("Error: Could not find estimate content to print.");
        return;
    }

    // Create a hidden iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute'; printFrame.style.width = '0';
    printFrame.style.height = '0'; printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden'; printFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printFrame);

    try {
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        // --- Embed Print Styles Directly ---
        frameDoc.write(`<!DOCTYPE html>
        <html>
        <head>
            <title>Print Estimate - nuDoors</title>
            <style>
@media print {
    /* Add #saveEstimatePdf and .print-instructions to the list of hidden elements */
    header, #wizard .step-navigation, #wizard .step-indicator, #exampleImageContainer, #addSectionBtn, #calculateBtn, .remove-button, #formActions, #printButtonContainer, #startOverBtn, #themeToggleBtn, small, #saveEstimatePdf, .print-instructions {
        display: none !important;
        visibility: hidden !important;
    }
    /* ... rest of print styles ... */
}
body[data-theme="dark"] .print-instructions {
     color: var(--text-color-light-style6-dark);
}

#printEstimate { padding: 0.8em 1.5em; font-size: 1em; width: auto; }
small { display: block; font-size: 0.85em; color: #888; margin-top: 5px; margin-left: 5px; line-height: 1.3; text-align: left; transition: color 0.3s ease;}
.invoice-error { padding: 1em; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px; margin: 1em auto; max-width: 95%; transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;}
.invoice-error p { margin: 0.2em 0; }
.invoice-loading { text-align:center; padding: 2em; color: var(--text-color-light-style6); font-style: italic; transition: color 0.3s ease; }


/* --- Dark Theme Application --- RESTORED FULL RULES */
body[data-theme="dark"] {
    --bg-color-main: var(--bg-color-main-dark);
    --bg-color-forms: var(--bg-color-forms-dark);
    --text-color-style6: var(--text-color-style6-dark);
    --text-color-light-style6: var(--text-color-light-style6-dark);
    color: var(--text-color-style6-dark);
    background: var(--bg-color-main-dark);
    --shadow-convex-outer: var(--shadow-convex-outer-dark);
    --shadow-inset: var(--shadow-inset-dark);
    --primary-color-style6: var(--primary-color-style6-dark);
    --secondary-color-style6: var(--secondary-color-style6-dark);
}
body[data-theme="dark"] header { border-bottom-color: #444; }
body[data-theme="dark"] #themeToggleBtn { background: #4a5a6a; color: #ddd; box-shadow: var(--shadow-convex-outer-dark); }
body[data-theme="dark"] #wizard { background-color: var(--bg-color-forms-dark); box-shadow: var(--shadow-convex-outer-dark); }
body[data-theme="dark"] .wizard-step { background-color: var(--bg-color-forms-dark); }
body[data-theme="dark"] .step-title, body[data-theme="dark"] .step-indicator { color: var(--primary-color-style6-dark); }
body[data-theme="dark"] .step-instructions { color: var(--text-color-light-style6-dark); }
body[data-theme="dark"] .step-navigation { border-top-color: #555; }
body[data-theme="dark"] .part, body[data-theme="dark"] .section { background-color: #333; box-shadow: var(--shadow-inset-dark); }
body[data-theme="dark"] .part h2, body[data-theme="dark"] #roughEstimateContainer h2 { color: var(--primary-color-style6-dark); border-bottom-color: #555; }
body[data-theme="dark"] label { color: #bbb; }
body[data-theme="dark"] input[type="number"], body[data-theme="dark"] select { background: var(--bg-color-forms-dark); color: var(--text-color-style6-dark); box-shadow: var(--shadow-inset-dark); border: 1px solid #555; }
body[data-theme="dark"] input[type="number"]:focus, body[data-theme="dark"] select:focus { box-shadow: var(--shadow-inset-dark), 0 0 0 2px rgba(54, 215, 237, 0.4); }
body[data-theme="dark"] select { background-image: none; padding-right: 20px; } /* Hide arrow and fix padding */
body[data-theme="dark"] button { background: var(--primary-color-style6-dark); box-shadow: var(--shadow-convex-outer-dark); color: #111; }
body[data-theme="dark"] button:hover:not(:disabled) { filter: brightness(1.1); box-shadow: none; }
body[data-theme="dark"] button:active:not(:disabled) { filter: brightness(0.95); box-shadow: var(--shadow-inset-dark); }
body[data-theme="dark"] button:disabled { background: #555 !important; color: #999 !important; box-shadow: var(--shadow-inset-dark); }
body[data-theme="dark"] button.remove-button { background: var(--secondary-color-style6-dark); box-shadow: 3px 3px 3px #7e2c2a, -3px -3px 3px #a04c49; color: #fff; }
body[data-theme="dark"] button.remove-button:active:not(:disabled) { filter: brightness(0.9); box-shadow: inset 1px 1px 2px #6f2624, inset -1px -1px 2px #b35b58; }
body[data-theme="dark"] button.wizard-nav-btn.prev, body[data-theme="dark"] #startOverBtn { background: #5a6a72; box-shadow: 6px 6px 6px #49565c, -6px -6px 6px #6b7e88; color: #ddd; }
body[data-theme="dark"] #toggleExampleBtn { background: #4a5a6a; color: #ddd; box-shadow: var(--shadow-convex-outer-dark); }
body[data-theme="dark"] #toggleExampleBtn:active:not(:disabled) { box-shadow: var(--shadow-inset-dark); }
body[data-theme="dark"] .invoice { background: var(--bg-color-main-dark); box-shadow: var(--shadow-convex-outer-dark); color: var(--text-color-style6-dark); }
body[data-theme="dark"] .invoice-header { border-bottom-color: #555; }
body[data-theme="dark"] .invoice-header h1 { color: var(--primary-color-style6-dark); }
body[data-theme="dark"] .invoice-header p { color: #aaa; }
body[data-theme="dark"] .invoice h3 { color: var(--primary-color-style6-dark); border-bottom-color: #555; }
body[data-theme="dark"] .summary-table tr, body[data-theme="dark"] .details-table tr { background: #3f3f43; box-shadow: var(--shadow-inset-dark); } /* Applies to non-mobile too */
body[data-theme="dark"] .summary-table .table-label, body[data-theme="dark"] .details-table th { color: #ccc; }
body[data-theme="dark"] .summary-table .table-value, body[data-theme="dark"] .details-table td { color: #ddd; }
body[data-theme="dark"] .details-table td:last-child { color: #eee; } /* Brighter cost */
body[data-theme="dark"] .summary-table tfoot { border-top-color: #666; }
body[data-theme="dark"] .summary-table .total-row td { color: var(--primary-color-style6-dark); }
body[data-theme="dark"] .details-table thead th { background: #4f4f53; color: #fff; }
body[data-theme="dark"] .details-table tbody tr { background: #454549; box-shadow: inset 2px 2px 3px #333, inset -2px -2px 3px #555;}
body[data-theme="dark"] .estimate-footer { color: #aaa; }
body[data-theme="dark"] small { color: #999; }
body[data-theme="dark"] .invoice-error { background-color: #582a2e; color: #f5c6cb; border-color: #a04a4e; }
body[data-theme="dark"] .invoice-loading { color: var(--text-color-light-style6-dark); }


/* Responsive */
@media (max-width: 1200px) { /* ... */ }
@media (max-width: 992px) { /* ... */ }

/* --- Mobile Table and Layout Adjustments --- */
@media (max-width: 768px) {
    /* ... (Keep body, header, wizard, section, etc. mobile overrides) ... */
    body { padding: 1em; min-width: 320px; }
    header { flex-direction: row; gap: 0.5em; text-align: left; align-items: center; padding-bottom: 0.5em; margin-bottom: 1.5em; }
    header h1 { font-size: 1.2em; margin-right: auto; }
    header img { height: 35px; max-height: 35px; }
    #themeToggleBtn { width: 40px; height: 30px; font-size: 1em; }
    #wizard { padding: 15px; max-width: 100%; min-height: auto; margin-bottom: 1.5em; }
    .wizard-step { padding: 20px 15px; }
    .section { flex-basis: 100%; max-width: 100%; min-width: 0; margin-bottom: 15px; padding: 15px; }
    #addSectionBtn { width: auto; padding: 0 25px; max-width: 250px; margin-left: auto; margin-right: auto; display: block; }
    .step-navigation { flex-direction: column; gap: 0.8em; align-items: center; margin-top: 1.5em; padding-top: 1em; }
    .wizard-nav-btn { width: 100%; max-width: 280px; font-size: 0.9em; }
    #toggleExampleBtn, #startOverBtn, #printEstimate { width: 100%; max-width: 280px; margin-left: auto; margin-right: auto; display: block; }
    button.remove-button { width: 28px; height: 28px; font-size: 1em; line-height: 26px; }
    .invoice { max-width: 100%; padding: 1em; }
    label { padding-left: 5px; margin-bottom: 4px; }
    input[type="number"], select { height: 45px; padding: 8px 15px; font-size: 14px; }
    body[data-theme="dark"] select { padding-right: 15px; } /* Dark mode select padding */
    select { padding-right: 35px; background-position: right 10px center; }


    /* --- RESPONSIVE TABLE STYLES (Stacking with Pseudo-elements) --- */
     .details-table, .summary-table:not(.total-row td) { /* Exclude total row */
        border: none; box-shadow: none; border-radius: 0; background: none;
        border-collapse: separate; border-spacing: 0 0.8em; display: block; width: 100%;
        padding: 0; margin-bottom: 1em; table-layout: auto !important;
     }
     .details-table thead, .summary-table thead { display: none; }
     .details-table tbody, .summary-table tbody { display: block; width: 100%; }
     .details-table tr, .summary-table tbody tr {
       display: block; width: 100% !important; margin-bottom: 0;
       border-radius: var(--border-radius-input); background: #f8f8f8;
       box-shadow: var(--shadow-inset); padding: 0.8em 1em; border: none;
       transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
     .details-table td, .summary-table tbody td {
       display: block; width: 100% !important; text-align: right !important;
       padding-left: 50%; padding-top: 0.3em; padding-bottom: 0.3em; padding-right: 0;
       position: relative; border: none; font-size: 0.9em; word-wrap: break-word; min-height: 1.4em;
       background: none; box-shadow: none;
    }
     .details-table td::before, .summary-table .table-label::before {
       content: attr(data-label); position: absolute; top: 0.3em; left: 10px;
       width: calc(50% - 20px); padding-right: 10px; font-weight: bold;
       text-align: left !important; white-space: nowrap; color: #333;
       transition: color 0.3s ease;
    }
    .details-table td[data-label="#"] {
         font-size: 1.1em; font-weight: bold; text-align: center !important;
         padding-left: 0; margin-bottom: 0.5em; border-bottom: 1px dashed #ccc;
         padding-bottom: 0.5em; transition: border-color 0.3s ease;
     }
     .details-table td[data-label="#"]::before { display: none; }
     .details-table td[data-label="Cost"], .summary-table .table-value { font-weight: bold; margin-top: 0.3em; }
     .summary-table .table-label { font-weight: normal; } /* Label cell */
     .summary-table .table-value { padding-left: 50%; } /* Value cell */
     .summary-table .table-value::before { display: none; } /* Hide label for value cell */

     /* Keep Total Row as standard table layout */
     .summary-table tfoot tr.total-row { display: table-row; background: none; box-shadow: none; padding: 0; }
     .summary-table tfoot tr.total-row td { display: table-cell; width: auto !important; text-align: right !important; position: static; padding: 1em 0.6em !important; border: none; border-top: 2px solid #ccc; font-size: 1.1em; font-weight: 900; color: var(--primary-color-style6); transition: border-color 0.3s ease, color 0.3s ease;}
     .summary-table tfoot tr.total-row td::before { display: none; }
     .summary-table tfoot tr.total-row .table-label { text-align: right !important; width: auto !important; padding-right: 0.5em; }


     /* --- DARK THEME MOBILE TABLE --- */
    body[data-theme="dark"] .details-table tr, body[data-theme="dark"] .summary-table tbody tr { background: #3f3f43; box-shadow: var(--shadow-inset-dark); }
    body[data-theme="dark"] .details-table td::before, body[data-theme="dark"] .summary-table .table-label::before { color: #ddd; }
    body[data-theme="dark"] .details-table td[data-label="#"] { border-bottom-color: #555; }
    body[data-theme="dark"] .summary-table tfoot tr.total-row td { border-top-color: #666; color: var(--primary-color-style6-dark); }

} /* End @media (max-width: 768px) */


@media (max-width: 480px) {
     /* ... (Keep other 480px styles) ... */
     body { padding: 0.5em; }
     header h1 { font-size: 1.1em; }
     #wizard { padding: 10px; }
     .wizard-step { padding: 15px; }
     .step-title { font-size: 1.3rem; }
     .section { padding: 12px; }
     input[type="number"], select { height: 42px; padding: 8px 12px; font-size: 13px; }
     body[data-theme="dark"] select { padding-right: 12px; }
     select { padding-right: 30px; background-position: right 8px center; }
     button { height: 40px; font-size: 0.85em; }
     .wizard-nav-btn, #toggleExampleBtn, #startOverBtn, #printEstimate, #addSectionBtn { max-width: 100%; padding-left: 15px; padding-right: 15px; }
     label { font-size: 0.8em; }
     small { font-size: 0.75em; }
     .invoice { padding: 0.8em; }
     .summary-table td, .details-table td { padding-top: 0.2em; padding-bottom: 0.2em; font-size: 0.85em; }
     .invoice h3 { font-size: 1em; }
     .summary-table .total-row td { font-size: 1em; }
     /* Further refine mobile table */
     .details-table, .summary-table { border-spacing: 0 0.6em; }
     .details-table tr, .summary-table tbody tr { padding: 0.6em 0.8em; }
     .details-table td, .summary-table tbody td { font-size: 0.85em; padding-left: 45%; }
     .details-table td::before, .summary-table .table-label::before { width: calc(45% - 15px); left: 8px; }
     .details-table td[data-label="#"] { padding-bottom: 0.4em; margin-bottom: 0.4em; }
     .summary-table .table-label { padding-left: 45%; }
     .summary-table .table-value { padding-left: 45%; }
     .summary-table tfoot tr.total-row td { padding: 0.8em 0.5em !important; font-size: 1em; } /* Adjust total padding */
}

/* Print Styles */
/* --- PASTE YOUR WORKING PRINT STYLES HERE --- */
@media print {
    @page { size: A4; margin: 1cm; }
    body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif !important; font-size: 10pt !important; line-height: 1.3; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; height: auto !important; width: auto !important; overflow: visible !important; }
    header, #wizard .step-navigation, #wizard .step-indicator, #exampleImageContainer, #addSectionBtn, #calculateBtn, .remove-button, #formActions, #printButtonContainer, #startOverBtn, #themeToggleBtn, small { display: none !important; visibility: hidden !important; }
    #wizard { display: block !important; visibility: visible !important; overflow: visible !important; position: static !important; box-shadow: none !important; border: none !important; background: none !important; min-height: auto !important; height: auto !important; width: auto !important; margin: 0 !important; padding: 0 !important; }
     .wizard-step { display: none !important; visibility: hidden !important; }
    #step-4 { display: block !important; visibility: visible !important; overflow: visible !important; position: static !important; opacity: 1 !important; transform: none !important; padding: 0 !important; margin: 0 !important; background: none !important; width: auto !important; height: auto !important; }
    #results { display: block !important; visibility: visible !important; margin: 0; padding: 0; border: none; width: 100%; overflow: visible !important; }
    .invoice { visibility: visible !important; display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; background: white !important; color: black !important; border-radius: 0 !important; font-size: 10pt !important; position: static !important; overflow: visible !important; }
    .invoice > * { visibility: visible !important; }
    .invoice-header { text-align: center; border-bottom: 2px solid black !important; padding-bottom: 0.8em !important; margin-bottom: 1.5em !important; color: black !important; }
    .invoice-header img.invoice-logo { display: block !important; max-height: 60px; margin: 0 auto 0.5em auto;}
    .invoice-header h1 { font-size: 16pt !important; font-weight: bold !important; color: black !important; margin-bottom: 0.1em !important; }
    .invoice-header p { font-size: 9pt !important; color: black !important; margin: 0.2em 0 !important; }
    .invoice h3 { font-size: 12pt !important; font-weight: bold !important; color: black !important; margin-top: 1.2em !important; margin-bottom: 0.6em !important; border-bottom: 1px solid #666 !important; padding-bottom: 0.2em !important; text-align: left !important; page-break-after: avoid !important; }
    .invoice h3:first-of-type { margin-top: 0 !important; }

    /* --- PRINT TABLE CELL & PSEUDO-ELEMENT RESET --- */
    .invoice table td,
    .invoice table th { /* Apply base print cell styles FIRST */
        display: table-cell !important; visibility: visible !important;
        border: 1px solid #ccc !important; padding: 5px 8px !important; /* Standard print padding */
        text-align: left !important; /* Default left align */
        vertical-align: top !important; color: black !important; background: white !important;
        box-shadow: none !important; word-wrap: break-word; position: static !important;
    }
    .invoice table td::before, .invoice table th::before { /* Hide ALL ::before */
        content: none !important; display: none !important; padding: 0 !important;
        margin: 0 !important; position: static !important; width: auto !important; left: auto !important;
    }
    /* --- END NEW PRINT RESET --- */

    /* --- Print Table Layout & Alignment (Keep these specific rules) --- */
    .invoice table { display: table !important; width: 100% !important; border-collapse: collapse !important; margin-bottom: 1.5em !important; font-size: 9pt !important; border-spacing: 0 !important; page-break-inside: auto; table-layout: fixed !important; }
    .invoice table thead { display: table-header-group !important; }
    .invoice table tbody { display: table-row-group !important; }
    .invoice table tr { display: table-row !important; page-break-inside: avoid !important; }
    .invoice thead th { background-color: #eee !important; font-weight: bold !important; border-bottom: 1px solid #999 !important; }

    /* Assign widths & alignment for print columns - TARGET TD VIA NTH-CHILD or DATA-LABEL */
      .invoice .details-table th:nth-child(1), .invoice .details-table td:nth-child(1) { width: 6%; text-align: center !important;} /* # */
      .invoice .details-table th:nth-child(2), .invoice .details-table td:nth-child(2) { width: 18%; text-align: left !important;} /* Door */
      .invoice .details-table th:nth-child(3), .invoice .details-table td:nth-child(3) { width: 18%; text-align: left !important;} /* Drawer */
      .invoice .details-table th:nth-child(4), .invoice .details-table td:nth-child(4) { width: 15%; text-align: center !important;} /* Finish */
      .invoice .details-table th:nth-child(5), .invoice .details-table td:nth-child(5) { width: 15%; text-align: center !important;} /* HxW */
      .invoice .details-table th:nth-child(6), .invoice .details-table td:nth-child(6) { width: 13%; text-align: center !important;} /* Area */
      .invoice .details-table th:nth-child(7), .invoice .details-table td:nth-child(7) { width: 15%; text-align: right !important; font-weight: 600 !important;} /* Cost */

    /* Summary Table */
    .invoice .summary-table { display: table !important; }
    .invoice .summary-table tbody { display: table-row-group !important; }
    .invoice .summary-table tr { display: table-row !important; }
    .invoice .summary-table td { display: table-cell !important; }
    .invoice .summary-table .table-label { font-weight: normal !important; width: 70%; border-right: none !important; text-align: left !important; }
    .invoice .summary-table .table-value { border-left: none !important; text-align: right !important; font-weight: normal !important; }
    /* Totals Row */
    .invoice tfoot { border-top: none !important; display: table-footer-group !important;}
    .invoice .summary-table tfoot tr { page-break-inside: avoid !important; display: table-row !important; }
    .invoice .total-row { background-color: white !important; border-top: 2px solid black !important; }
    .invoice .total-row td { font-weight: bold !important; font-size: 11pt !important; border: none !important; border-top: 2px solid black !important; padding: 6px 8px !important; color: black !important; display: table-cell !important; }
    .invoice .total-row .table-label { text-align: right !important; width: auto !important; padding-right: 1em; }
    .invoice .total-row .table-value { text-align: right !important; }
    /* Footer */
    .estimate-footer { text-align: center !important; margin-top: 2em !important; padding-top: 1em !important; border-top: 1px solid #ccc !important; font-size: 8pt !important; color: #333 !important; page-break-before: auto; }
    /* Errors */
     .invoice-error { display: none !important; }

} /* End of @media print */

                @media print {
                    /* Basic page setup */
                    @page { size: A4; margin: 1cm; }
                    body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif !important; font-size: 10pt !important; line-height: 1.3; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; height: auto !important; width: auto !important; overflow: visible !important; }
                    /* Hide unwanted */
                    header, #wizard .step-navigation, #wizard .step-indicator, #exampleImageContainer, #addSectionBtn, #calculateBtn, .remove-button, #formActions, #printButtonContainer, #startOverBtn, #themeToggleBtn, small, .print-instructions /* Added */ { display: none !important; visibility: hidden !important; }
                    /* Override Wizard */
                    #wizard { display: block !important; visibility: visible !important; overflow: visible !important; position: static !important; box-shadow: none !important; border: none !important; background: none !important; min-height: auto !important; height: auto !important; width: auto !important; margin: 0 !important; padding: 0 !important; }
                    /* Hide steps */
                    .wizard-step { display: none !important; visibility: hidden !important; }
                    /* Override Step-4 */
                    #step-4 { display: block !important; visibility: visible !important; overflow: visible !important; position: static !important; opacity: 1 !important; transform: none !important; padding: 0 !important; margin: 0 !important; background: none !important; width: auto !important; height: auto !important; }
                    /* Results */
                    #results { display: block !important; visibility: visible !important; margin: 0; padding: 0; border: none; width: 100%; overflow: visible !important; }
                    /* Invoice container */
                    .invoice { visibility: visible !important; display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; background: white !important; color: black !important; border-radius: 0 !important; font-size: 10pt !important; position: static !important; overflow: visible !important; }
                    .invoice > * { visibility: visible !important; }
                    /* Invoice Header */
                    .invoice-header { text-align: center; border-bottom: 2px solid black !important; padding-bottom: 0.8em !important; margin-bottom: 1.5em !important; color: black !important; }
                    .invoice-header img.invoice-logo { display: block !important; max-height: 60px; margin: 0 auto 0.5em auto;}
                    .invoice-header h1 { font-size: 16pt !important; font-weight: bold !important; color: black !important; margin-bottom: 0.1em !important; }
                    .invoice-header p { font-size: 9pt !important; color: black !important; margin: 0.2em 0 !important; }
                    /* Section Titles */
                    .invoice h3 { font-size: 12pt !important; font-weight: bold !important; color: black !important; margin-top: 1.2em !important; margin-bottom: 0.6em !important; border-bottom: 1px solid #666 !important; padding-bottom: 0.2em !important; text-align: left !important; page-break-after: avoid !important; }
                    .invoice h3:first-of-type { margin-top: 0 !important; }

                    /* PRINT TABLE CELL & PSEUDO-ELEMENT RESET */
                    .invoice table td,
                    .invoice table th { display: table-cell !important; visibility: visible !important; border: 1px solid #ccc !important; padding: 5px 8px !important; text-align: left !important; vertical-align: top !important; color: black !important; background: white !important; box-shadow: none !important; word-wrap: break-word; position: static !important; }
                    .invoice table td::before, .invoice table th::before { content: none !important; display: none !important; padding: 0 !important; margin: 0 !important; position: static !important; width: auto !important; left: auto !important; }

                    /* Print Table Layout & Alignment */
                    .invoice table { display: table !important; width: 100% !important; border-collapse: collapse !important; margin-bottom: 1.5em !important; font-size: 9pt !important; border-spacing: 0 !important; page-break-inside: auto; table-layout: fixed !important; }
                    .invoice table thead { display: table-header-group !important; }
                    .invoice table tbody { display: table-row-group !important; }
                    .invoice table tr { display: table-row !important; page-break-inside: avoid !important; }
                    .invoice thead th { background-color: #eee !important; font-weight: bold !important; border-bottom: 1px solid #999 !important; }

                    /* Assign widths & alignment for print columns */
                    .invoice .details-table th:nth-child(1), .invoice .details-table td:nth-child(1) { width: 6%; text-align: center !important;} /* # */
                    .invoice .details-table th:nth-child(2), .invoice .details-table td:nth-child(2) { width: 18%; text-align: left !important;} /* Door */
                    .invoice .details-table th:nth-child(3), .invoice .details-table td:nth-child(3) { width: 18%; text-align: left !important;} /* Drawer */
                    .invoice .details-table th:nth-child(4), .invoice .details-table td:nth-child(4) { width: 15%; text-align: center !important;} /* Finish */
                    .invoice .details-table th:nth-child(5), .invoice .details-table td:nth-child(5) { width: 15%; text-align: center !important;} /* HxW */
                    .invoice .details-table th:nth-child(6), .invoice .details-table td:nth-child(6) { width: 13%; text-align: center !important;} /* Area */
                    .invoice .details-table th:nth-child(7), .invoice .details-table td:nth-child(7) { width: 15%; text-align: right !important; font-weight: 600 !important;} /* Cost */

                    /* Summary Table */
                    .invoice .summary-table { display: table !important; }
                    .invoice .summary-table tbody { display: table-row-group !important; }
                    .invoice .summary-table tr { display: table-row !important; }
                    .invoice .summary-table td { display: table-cell !important; padding: 5px 8px !important; }
                    .invoice .summary-table .table-label { font-weight: normal !important; width: 70%; border-right: none !important; text-align: left !important; }
                    .invoice .summary-table .table-value { border-left: none !important; text-align: right !important; font-weight: normal !important; }
                    /* Totals Row */
                    .invoice tfoot { border-top: none !important; display: table-footer-group !important;}
                    .invoice .summary-table tfoot tr { page-break-inside: avoid !important; display: table-row !important; }
                    .invoice .total-row { background-color: white !important; border-top: 2px solid black !important; }
                    .invoice .total-row td { font-weight: bold !important; font-size: 11pt !important; border: none !important; border-top: 2px solid black !important; padding: 6px 8px !important; color: black !important; display: table-cell !important; }
                    .invoice .total-row .table-label { text-align: right !important; width: auto !important; padding-right: 1em; }
                    .invoice .total-row .table-value { text-align: right !important; }
                    /* Footer */
                    .estimate-footer { text-align: center !important; margin-top: 2em !important; padding-top: 1em !important; border-top: 1px solid #ccc !important; font-size: 8pt !important; color: #333 !important; page-break-before: auto; }
                    /* Errors */
                    .invoice-error { display: none !important; }
                }

                /* Minimal Base Styles for Iframe Rendering */
                body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: black; }
                h1, h3 { margin: 1em 0 0.5em 0; padding: 0; }
                p { margin: 0 0 0.5em 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 1em; font-size: 9pt;}
                th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top; }
                th { background-color: #eee; font-weight: bold; }
                tfoot { font-weight: bold; }
                .total-row td { border-top: 2px solid black; font-size: 11pt; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .invoice { /* Minimal styles to prevent default iframe margins */ margin: 0; padding: 0; }

            </style>
        </head>
        <body>
            ${invoiceElement.outerHTML}
        </body>
        </html>`);
        frameDoc.close();

        setTimeout(() => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                console.log('[Client] iframe print command issued.');
            } catch(printError) {
                 console.error('[Client] Error calling print on iframe:', printError);
                  alert("An error occurred trying to print.");
            } finally {
                 setTimeout(() => { // Delay removal
                     if (printFrame.parentNode) { // Check if still exists
                         document.body.removeChild(printFrame);
                         console.log('[Client] iframe removed.');
                     }
                 }, 500);
            }
        }, 250); // Delay before calling print

    } catch (error) {
        console.error('[Client] Error creating print iframe:', error);
        alert("An error occurred preparing the print view.");
        if (printFrame && printFrame.parentNode) { document.body.removeChild(printFrame); }
    }
}

/** Set up wizard navigation and general button listeners */
function initializeWizard() {
    console.log('[Client] Initializing wizard UI listeners...');
    const printBtnActual = document.getElementById('printEstimate');
    // Removed saveBtn reference

    wizard.addEventListener('click', (event) => {
        if (event.target.matches('.wizard-nav-btn.next') && currentStep !== 3) { navigateWizard('next'); }
        else if (event.target.matches('.wizard-nav-btn.prev')) { navigateWizard('prev'); }
    });

    if(addSectionBtn) addSectionBtn.addEventListener('click', handleAddSection);
    if(calculateBtn) calculateBtn.addEventListener('click', handleCalculate);
    if(startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
    if(toggleExampleBtn) toggleExampleBtn.addEventListener('click', handleToggleExample);

    // --- Attach IFRAME Print Handler ---
    if(printBtnActual) {
        printBtnActual.addEventListener('click', handlePrintRequest); // Attach iframe handler
    } else { console.warn("[Client] Print Estimate button not found."); }
    // Removed saveBtn listener

    if(sectionsContainer) sectionsContainer.addEventListener('click', handleRemoveSection);

    steps.forEach((step, index) => {
        step.classList.remove('active', 'hiding');
        if (index === currentStep - 1) { step.classList.add('active'); }
    });
    if(printButtonContainer) printButtonContainer.style.display = 'none';
    console.log('[Client] Wizard UI Initialized.');
}

/** Initial setup when DOM is ready */
function main() {
    console.log('[Client] DOM Loaded. App initializing...');
    wizard = document.getElementById('wizard');
    steps = wizard?.querySelectorAll('.wizard-step');
    sectionsContainer = document.getElementById('sectionsContainer');
    addSectionBtn = document.getElementById('addSectionBtn');
    calculateBtn = document.getElementById('calculateBtn');
    resultsDiv = document.getElementById('results');
    startOverBtn = document.getElementById('startOverBtn');
    printButtonContainer = document.getElementById('printButtonContainer');
    toggleExampleBtn = document.getElementById('toggleExampleBtn');
    exampleImageDiv = document.getElementById('exampleImage');
    themeToggleBtn = document.getElementById('themeToggleBtn');

    const criticalElements = [wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printButtonContainer, toggleExampleBtn, exampleImageDiv, themeToggleBtn];
    if (!steps || steps.length === 0 || criticalElements.some(el => !el)) {
        console.error("[Client] Critical UI elements missing.", { /* ... checks ... */ });
        document.body.innerHTML = '<p style="color: red; font-weight: bold; padding: 2em;">Error: UI is incomplete.</p>';
        return;
    }
    themeToggleBtn.addEventListener('click', handleThemeToggle);
    loadInitialTheme();
    initPricingData();
}

// --- Run the main setup function ---
document.addEventListener('DOMContentLoaded', main);