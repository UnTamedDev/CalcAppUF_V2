// --- FILE: public/script.js (UF VERSION - FINAL w/ Combined Print Method) ---

let pricingData = null;
let styleMap = {};
let allStyles = [];
let currentStep = 1;
let sectionCounter = 0;

// --- DOM Element References ---
let wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printBtn, toggleExampleBtn, exampleImageDiv, printButtonContainer, themeToggleBtn; // Removed toggleDetailsBtn/internalDetailsDiv

// --- Theme Handling ---
const K_THEME = 'nuDoorsEstimatorTheme';
function applyTheme(theme) { if (theme === 'dark') { document.body.dataset.theme = 'dark'; if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; localStorage.setItem(K_THEME, 'dark'); } else { document.body.removeAttribute('data-theme'); if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; localStorage.setItem(K_THEME, 'light'); } console.log(`[Client UF] Theme applied: ${theme}`); }
function handleThemeToggle() { const currentTheme = document.body.dataset.theme; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
function loadInitialTheme() { const savedTheme = localStorage.getItem(K_THEME) || 'light'; themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn'); applyTheme(savedTheme); }

/** Build style list */
function processPricingData(data) {
    const list = []; const map = {};
    if (!data || !Array.isArray(data.doorPricingGroups)) { console.error("[Client UF] Invalid pricing data received:", data); return { map: {}, list: [] }; }
    for (const group of data.doorPricingGroups) { if (!group || !Array.isArray(group.styles)) continue; for (const style of group.styles) { if (typeof style === 'string' && !list.includes(style)) { list.push(style); map[style] = { Painted: group.Painted, Primed: group.Primed, Unfinished: group.Unfinished }; } } }
    return { map, list: list.sort() };
}

/** Populate style dropdowns */
function populateStyleDropdowns(container) {
    const doorSelect = container.querySelector('select[name="sectionDoorStyle"]'); const drawerSelect = container.querySelector('select[name="sectionDrawerStyle"]');
    if (!doorSelect || !drawerSelect) { console.warn("[Client UF] Could not find style select elements:", container); return; }
    if (allStyles.length === 0) { console.warn("[Client UF] No styles available."); doorSelect.innerHTML = '<option value="">Error</option>'; drawerSelect.innerHTML = '<option value="">Error</option>'; return; }
    const optionsHtml = allStyles.map(style => `<option value="${style}">${style}</option>`).join('');
    doorSelect.innerHTML = optionsHtml; drawerSelect.innerHTML = optionsHtml;
    if (allStyles.length > 0) { doorSelect.value = allStyles[0]; drawerSelect.value = allStyles[0]; }
}

/** Fetch pricing data */
async function initPricingData() {
    try {
        console.log('[Client UF] Fetching pricing data for styles...');
        // USE CORRECT PATH
        const res = await fetch('/data/pricingData.json');
        if (!res.ok) { throw new Error(`HTTP error! status: ${res.status} fetching pricing data.`); }
        pricingData = await res.json();
        if (!pricingData || !pricingData.doorPricingGroups) { throw new Error('Invalid pricing data: missing doorPricingGroups.'); }
        const { map, list } = processPricingData(pricingData);
        styleMap = map; allStyles = list;
        console.log('[Client UF] Pricing loaded. Styles:', allStyles.length);
        initializeSections(); initializeWizard();
    } catch (e) {
        console.error('[Client UF] Failed to load pricing data:', e);
        displayError("Could not load essential data. Please refresh.");
        if (calculateBtn) calculateBtn.disabled = true;
    }
}

/** Create HTML structure for a single section */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div'); sectionDiv.className = 'section'; sectionDiv.dataset.index = index;
    const sectionIdPrefix = `section-${index}-`;
    sectionDiv.innerHTML = `
      <div class="section-header"><span class="section-id">Section ${index + 1}</span><button type="button" class="remove-button" data-remove-index="${index}" title="Remove Section ${index + 1}">×</button></div>
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
function handleAddSection() { console.log(`[Client UF] Adding section ${sectionCounter + 1}`); const newSection = createRoughEstimateSection(sectionCounter); sectionsContainer.appendChild(newSection); sectionCounter++; updateSectionNumbers(); }

/** Remove a section */
function handleRemoveSection(event) { const removeButton = event.target.closest('.remove-button'); if (removeButton) { const sectionToRemove = removeButton.closest('.section'); if (sectionToRemove) { const indexToRemove = sectionToRemove.dataset.index; console.log(`[Client UF] Removing section ${parseInt(indexToRemove)+1}`); sectionToRemove.remove(); updateSectionNumbers(); } } }

/** Update section numbers */
function updateSectionNumbers() { const remainingSections = sectionsContainer.querySelectorAll('.section'); remainingSections.forEach((section, i) => { const idSpan = section.querySelector('.section-id'); const removeBtn = section.querySelector('.remove-button'); const index = i; if (idSpan) idSpan.textContent = `Section ${index + 1}`; section.dataset.index = index; section.querySelectorAll('[id^="section-"]').forEach(el => { const oldId = el.id; const namePart = oldId.substring(oldId.lastIndexOf('-') + 1); const newId = `section-${index}-${namePart}`; el.id = newId; const label = section.querySelector(`label[for="${oldId}"]`); if(label) label.setAttribute('for', newId); }); if (removeBtn) { removeBtn.dataset.removeIndex = index; removeBtn.title = `Remove Section ${index + 1}`; } }); sectionCounter = remainingSections.length; console.log('[Client UF] Section count:', sectionCounter); const removeButtons = sectionsContainer.querySelectorAll('.remove-button'); removeButtons.forEach(btn => btn.disabled = (remainingSections.length <= 1)); }

/** Wizard Navigation Logic */
function navigateWizard(direction) { const currentStepElement = wizard.querySelector(`.wizard-step.active`); if (!currentStepElement) { console.error('[Client UF] Active step not found.'); return; } const targetStepNum = direction === 'next' ? currentStep + 1 : currentStep - 1; if (direction === 'next' && currentStep === 1 && !validateStep1()) { return; } if (direction === 'next' && currentStep === 2 && !validateStep2()) { return; } if (targetStepNum < 1 || targetStepNum > steps.length) { console.warn('[Client UF] Nav out of bounds.'); return; } const targetStepElement = wizard.querySelector(`#step-${targetStepNum}`); if (targetStepElement) { currentStepElement.classList.add('hiding'); currentStepElement.classList.remove('active'); setTimeout(() => { currentStepElement.classList.remove('hiding'); }, 400); targetStepElement.classList.add('active'); currentStep = targetStepNum; console.log(`[Client UF] Navigated to step ${currentStep}`); wizard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else { console.error(`[Client UF] Target step element not found: ${targetStepNum}`); } }

// --- Input Validation ---
function validateStep1() { let isValid = true; const sectionElements = sectionsContainer.querySelectorAll('.section'); if (sectionElements.length === 0) { alert("Please add at least one section."); isValid = false; return isValid; } sectionElements.forEach((sectionEl) => { const heightInput = sectionEl.querySelector('[name="sectionHeight"]'); const widthInput = sectionEl.querySelector('[name="sectionWidth"]'); const height = parseFloat(heightInput.value); const width = parseFloat(widthInput.value); heightInput.style.border = ''; widthInput.style.border = ''; if (isNaN(height) || height <= 0) { heightInput.style.border = '2px solid red'; isValid = false; } if (isNaN(width) || width <= 0) { widthInput.style.border = '2px solid red'; isValid = false; } }); if (!isValid) { alert("Please ensure all section dimensions (Height and Width) are numbers greater than 0."); } return isValid; }
function validateStep2() { let isValid = true; const step2Inputs = document.querySelectorAll('#step-2 input[type="number"]'); step2Inputs.forEach(input => { const value = parseInt(input.value, 10); input.style.border = ''; if (isNaN(value) || value < 0) { input.style.border = '2px solid red'; isValid = false; } }); if (!isValid) { alert("Please ensure all piece counts are whole numbers (0 or greater)."); } return isValid; }
function validateStep3() { let isValid = true; const customPaintInput = document.querySelector('#step-3 input[name="customPaintQty"]'); const value = parseInt(customPaintInput.value, 10); customPaintInput.style.border = ''; if (isNaN(value) || value < 0) { customPaintInput.style.border = '2px solid red'; isValid = false; alert("Please ensure Custom Paint Quantity is a whole number (0 or greater)."); } return isValid; }

/** Gather data */
function gatherFormData() { const formData = { sections: [], part2: {}, part3: {} }; const sectionElements = sectionsContainer.querySelectorAll('.section'); sectionElements.forEach((sectionEl, index) => { const sectionData = { doorStyle: sectionEl.querySelector('[name="sectionDoorStyle"]').value, drawerStyle: sectionEl.querySelector('[name="sectionDrawerStyle"]').value, finish: sectionEl.querySelector('[name="sectionFinish"]').value, height: sectionEl.querySelector('[name="sectionHeight"]').value, width: sectionEl.querySelector('[name="sectionWidth"]').value }; formData.sections.push(sectionData); }); const step2Container = document.getElementById('step-2'); if (step2Container) { formData.part2.numDrawers = step2Container.querySelector('#numDrawers')?.value ?? '0'; formData.part2.doors_0_36 = step2Container.querySelector('#doors_0_36')?.value ?? '0'; formData.part2.doors_36_60 = step2Container.querySelector('#doors_36_60')?.value ?? '0'; formData.part2.doors_60_82 = step2Container.querySelector('#doors_60_82')?.value ?? '0'; formData.part2.lazySusanQty = step2Container.querySelector('#lazySusanQty')?.value ?? '0'; } else { console.warn("[Client UF] Step 2 container not found."); } const step3Container = document.getElementById('step-3'); if (step3Container) { formData.part3.customPaintQty = step3Container.querySelector('#customPaintQty')?.value ?? '0'; } else { console.warn("[Client UF] Step 3 container not found."); } return formData; }

/** Handle calculation */
async function handleCalculate() {
    console.log('[Client UF] Calculate button clicked.'); if (!validateStep1() || !validateStep2() || !validateStep3()) { alert("Please correct errors."); return; } calculateBtn.disabled = true; calculateBtn.textContent = 'Calculating...'; resultsDiv.innerHTML = '<div class="invoice-loading"><p>Generating estimate...</p></div>'; navigateWizard('next'); const payload = gatherFormData(); console.log('[Client UF] Sending payload:', JSON.stringify(payload, null, 2)); try { const response = await fetch('/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload), }); const responseData = await response.json(); if (!response.ok) { const errorMessage = responseData?.message || responseData?.error || `API Error (${response.status})`; throw new Error(errorMessage); } console.log('[Client UF] Received results:', responseData); displayResults(responseData); } catch (error) { console.error('[Client UF] Calc request error:', error); displayError(`Calculation Failed: ${error.message}`); if (currentStep === 4) navigateWizard('prev'); } finally { calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate'; }
}

/** Format currency */
const formatCurrency = (value) => { const number = Number(value); if (isNaN(number)) { console.warn(`[Client UF] Invalid value for currency: ${value}`); return '$0.00'; } return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); };

/** Display error */
function displayError(message) { resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong> ${message}</p></div>`; if (currentStep !== 4) { const currentActive = wizard.querySelector('.wizard-step.active'); const resultsStep = wizard.querySelector('#step-4'); if (currentActive && resultsStep && currentActive !== resultsStep) { currentActive.classList.remove('active', 'hiding'); resultsStep.classList.add('active'); currentStep = 4; } } if(printButtonContainer) printButtonContainer.style.display = 'none'; }

/** Display calculation results */
function displayResults(data) {
    console.log("[Client UF] Displaying results:", data); if (!resultsDiv) { console.error("[Client UF] CRITICAL: resultsDiv is null!"); return; }
    if (!data || typeof data !== 'object') { console.error("[Client UF] Invalid results data received:", data); displayError('Invalid results data.'); return; }
    const { overallTotal = 0, doorCostTotal = 0, hingeCost = 0, hingeCount = 0, lazySusanCost = 0, specialFeatures = {}, sections = [], part2 = {}, part3 = {} } = data; const customPaintCost = specialFeatures?.customPaintCost || 0;
    let sectionsHtml = `<h3>Section Breakdown</h3>`; if (sections.length > 0) { sectionsHtml += `<table class="details-table"><thead><tr><th>#</th><th>Door Style</th><th>Drawer Style</th><th>Finish</th><th>HxW (in)</th><th>Area (sqft)</th><th>Cost</th></tr></thead><tbody>`; sections.forEach((s, i) => { const drawerStyleText = (s.drawerStyle && s.drawerStyle !== s.doorStyle) ? s.drawerStyle : '-'; sectionsHtml += `<tr class="primary-info-row"><td data-label="#">${i + 1}</td><td data-label="Door Style">${s.doorStyle || 'N/A'}</td><td data-label="Drawer Style">${drawerStyleText}</td><td data-label="Finish">${s.finish || 'N/A'}</td><td data-label="HxW (in)">${s.height || 0}" x ${s.width || 0}"</td><td data-label="Area (sqft)">${s.area?.toFixed(2) || 'N/A'}</td><td data-label="Cost">${formatCurrency(s.totalSectionCost)}</td></tr>`; }); sectionsHtml += `</tbody></table>`; } else { sectionsHtml += `<p style="text-align: center; color: #666;">No sections entered.</p>`; }
    let countsHtml = `<h3 style="margin-top: 1.5em;">Counts & Features Summary</h3><table class="details-table"><tbody><tr><td data-label="Doors 0-36" Qty">Doors 0-36" Qty</td><td data-label-value>${part2.doors_0_36 || 0}</td></tr><tr><td data-label="Doors 36-60" Qty">Doors 36-60" Qty</td><td data-label-value>${part2.doors_36_60 || 0}</td></tr><tr><td data-label="Doors 60-82" Qty">Doors 60-82" Qty</td><td data-label-value>${part2.doors_60_82 || 0}</td></tr><tr><td data-label="Total Drawers">Total Drawers</td><td data-label-value>${part2.numDrawers || 0}</td></tr><tr><td data-label="Lazy Susans">Lazy Susans</td><td data-label-value>${part2.lazySusanQty || 0}</td></tr><tr><td data-label="Custom Paint Colors">Custom Paint Colors</td><td data-label-value>${part3.customPaintQty || 0}</td></tr><tr><td data-label="Total Hinges Needed"><b>Total Hinges Needed</b></td><td data-label-value><b>${hingeCount}</b></td></tr></tbody></table>`;
    let costSummaryHtml = `<h3 style="margin-top: 1.5em;">Cost Summary</h3><table class="summary-table"><tbody><tr><td class="table-label" data-label="Section Cost">Total Section Cost (Doors/Drawers)</td><td class="table-value">${formatCurrency(doorCostTotal)}</td></tr><tr><td class="table-label" data-label="Hinge Cost">Hinge Boring Cost (${hingeCount} hinges)</td><td class="table-value">${formatCurrency(hingeCost)}</td></tr>`; if (lazySusanCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Lazy Susan Cost">Lazy Susans (${part2.lazySusanQty || 0})</td><td class="table-value">${formatCurrency(lazySusanCost)}</td></tr>`; if (customPaintCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Custom Paint Fee">Custom Paint Fee</td><td class="table-value">${formatCurrency(customPaintCost)}</td></tr>`; costSummaryHtml += `</tbody><tfoot><tr class="total-row"><td class="table-label">Estimated Total</td><td class="table-value">${formatCurrency(overallTotal)}</td></tr></tfoot></table>`;
    const finalHtml = `<div class="invoice"><div class="invoice-header"><h1>Estimate Summary</h1><p>Thank you for using the nuDoors Estimator!</p><p>Estimate ID: ${Date.now()}</p></div>${sectionsHtml}${countsHtml}${costSummaryHtml}<div class="estimate-footer"><p>This is an estimate only. Final price may vary. Tax not included.</p></div></div>`;
    console.log("[Client UF] About to set innerHTML."); resultsDiv.innerHTML = finalHtml; console.log("[Client UF] Finished setting innerHTML."); if (printButtonContainer) printButtonContainer.style.display = 'block';
}

/** Toggle example image */
function handleToggleExample() { if (!exampleImageDiv || !toggleExampleBtn) return; const isHidden = exampleImageDiv.style.display === 'none'; exampleImageDiv.style.display = isHidden ? 'block' : 'none'; toggleExampleBtn.textContent = isHidden ? 'Hide Example Image' : 'Show Example Image'; }

/** Reset form */
function handleStartOver() { console.log('[Client UF] Starting over.'); document.querySelectorAll('#step-1 input, #step-1 select, #step-2 input, #step-3 input').forEach(input => { if (input.type === 'number') { input.value = input.name === 'sectionHeight' || input.name === 'sectionWidth' ? '12' : '0'; } else if (input.tagName === 'SELECT') { input.selectedIndex = 0; } input.style.border = ''; }); sectionsContainer.innerHTML = ''; sectionCounter = 0; initializeSections(); resultsDiv.innerHTML = ''; if(printButtonContainer) printButtonContainer.style.display = 'none'; const currentActive = wizard.querySelector('.wizard-step.active'); const firstStep = wizard.querySelector('#step-1'); if (currentActive && firstStep && currentActive !== firstStep) { currentActive.classList.remove('active'); firstStep.classList.add('active'); } currentStep = 1; if (calculateBtn) { calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate'; } window.scrollTo({ top: 0, behavior: 'smooth' }); }

/** Init sections */
function initializeSections() { sectionsContainer.innerHTML = ''; sectionCounter = 0; if (allStyles.length > 0) { handleAddSection(); } else { console.warn('[Client UF] Cannot initialize sections, styles not loaded.'); sectionsContainer.innerHTML = '<p class="invoice-loading">Loading styles...</p>'; } updateSectionNumbers(); }

/** Handles printing using an iframe - Fallback Method */
async function printViaIframe() {
    console.log('[Client UF] Attempting print via iframe method...');
    const invoiceElement = document.querySelector('#results .invoice');
    if (!invoiceElement) { console.error("Cannot print via iframe: Invoice element not found."); alert("Error: Could not find estimate content."); return; }
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute'; printFrame.style.width = '0'; printFrame.style.height = '0'; printFrame.style.border = '0'; printFrame.style.visibility = 'hidden'; printFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printFrame);
    try {
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`<!DOCTYPE html><html><head><title>Print Estimate - nuDoors</title><style>
/* --- EMBEDDED PRINT STYLES --- */
@media print { @page{size:A4;margin:1cm}body{background:#fff!important;color:#000!important;margin:0!important;padding:0!important;font-family:Arial,sans-serif!important;font-size:10pt!important;line-height:1.3;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;height:auto!important;width:auto!important;overflow:visible!important}header,#wizard .step-navigation,#wizard .step-indicator,#exampleImageContainer,#addSectionBtn,#calculateBtn,.remove-button,#formActions,#printButtonContainer,#startOverBtn,#themeToggleBtn,small,.print-instructions,#saveEstimatePdf /*Added*/{display:none!important;visibility:hidden!important}#wizard{display:block!important;visibility:visible!important;overflow:visible!important;position:static!important;box-shadow:none!important;border:none!important;background:0 0!important;min-height:auto!important;height:auto!important;width:auto!important;margin:0!important;padding:0!important}.wizard-step{display:none!important;visibility:hidden!important}#step-4{display:block!important;visibility:visible!important;overflow:visible!important;position:static!important;opacity:1!important;transform:none!important;padding:0!important;margin:0!important;background:0 0!important;width:auto!important;height:auto!important}#results{display:block!important;visibility:visible!important;margin:0;padding:0;border:none;width:100%;overflow:visible!important}.invoice{visibility:visible!important;display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;border:none!important;box-shadow:none!important;background:#fff!important;color:#000!important;border-radius:0!important;font-size:10pt!important;position:static!important;overflow:visible!important}.invoice>*{visibility:visible!important}.invoice-header{text-align:center;border-bottom:2px solid #000!important;padding-bottom:.8em!important;margin-bottom:1.5em!important;color:#000!important}.invoice-header img.invoice-logo{display:block!important;max-height:60px;margin:0 auto .5em;filter:grayscale(100%)}.invoice-header h1{font-size:16pt!important;font-weight:700!important;color:#000!important;margin-bottom:.1em!important}.invoice-header p{font-size:9pt!important;color:#000!important;margin:.2em 0!important}.invoice h3{font-size:12pt!important;font-weight:700!important;color:#000!important;margin-top:1.2em!important;margin-bottom:.6em!important;border-bottom:1px solid #666!important;padding-bottom:.2em!important;text-align:left!important;page-break-after:avoid!important}.invoice h3:first-of-type{margin-top:0!important}.invoice table td,.invoice table th{display:table-cell!important;visibility:visible!important;border:1px solid #ccc!important;padding:5px 8px!important;text-align:left!important;vertical-align:top!important;color:#000!important;background:#fff!important;box-shadow:none!important;word-wrap:break-word;position:static!important}.invoice table td::before,.invoice table th::before{content:none!important;display:none!important;padding:0!important;margin:0!important;position:static!important;width:auto!important;left:auto!important}.invoice table{display:table!important;width:100%!important;border-collapse:collapse!important;margin-bottom:1.5em!important;font-size:9pt!important;border-spacing:0!important;page-break-inside:auto;table-layout:fixed!important}.invoice table thead{display:table-header-group!important}.invoice table tbody{display:table-row-group!important}.invoice table tr{display:table-row!important;page-break-inside:avoid!important}.invoice thead th{background-color:#eee!important;font-weight:700!important;border-bottom:1px solid #999!important;color:#000!important;page-break-inside:avoid!important}.invoice .details-table th:nth-child(1),.invoice .details-table td:nth-child(1){width:6%;text-align:center!important}.invoice .details-table th:nth-child(2),.invoice .details-table td:nth-child(2){width:18%;text-align:left!important}.invoice .details-table th:nth-child(3),.invoice .details-table td:nth-child(3){width:18%;text-align:left!important}.invoice .details-table th:nth-child(4),.invoice .details-table td:nth-child(4){width:15%;text-align:center!important}.invoice .details-table th:nth-child(5),.invoice .details-table td:nth-child(5){width:15%;text-align:center!important}.invoice .details-table th:nth-child(6),.invoice .details-table td:nth-child(6){width:13%;text-align:center!important}.invoice .details-table th:nth-child(7),.invoice .details-table td:nth-child(7){width:15%;text-align:right!important;font-weight:600!important}.invoice .summary-table{display:table!important}.invoice .summary-table tbody{display:table-row-group!important}.invoice .summary-table tr{display:table-row!important}.invoice .summary-table td{display:table-cell!important}.invoice .summary-table .table-label{font-weight:400!important;width:70%;border-right:none!important;text-align:left!important}.invoice .summary-table .table-label:before{display:none!important}.invoice .summary-table .table-value{border-left:none!important;text-align:right!important;font-weight:400!important}.invoice .summary-table .table-value:before{display:none!important}.invoice tfoot{border-top:none!important;display:table-footer-group!important}.invoice .summary-table tfoot tr{page-break-inside:avoid!important;display:table-row!important}.invoice .total-row{background-color:#fff!important;border-top:2px solid #000!important}.invoice .total-row td{font-weight:700!important;font-size:11pt!important;border:none!important;border-top:2px solid #000!important;padding:6px 8px!important;color:#000!important;display:table-cell!important}.invoice .total-row td:before{display:none!important}.invoice .total-row .table-label{text-align:right!important;width:auto!important;padding-right:1em}.invoice .total-row .table-value{text-align:right!important}.estimate-footer{text-align:center!important;margin-top:2em!important;padding-top:1em!important;border-top:1px solid #ccc!important;font-size:8pt!important;color:#333!important;page-break-before:auto}.invoice-error{display:none!important}}
/* Minimal Base Styles */ body{font-family:Arial,sans-serif;font-size:10pt;line-height:1.3;color:#000}h1,h3{margin:1em 0 .5em;padding:0}p{margin:0 0 .5em;padding:0}table{border-collapse:collapse;width:100%;margin-bottom:1em;font-size:9pt}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}th{background-color:#eee;font-weight:700}tfoot{font-weight:700}.total-row td{border-top:2px solid #000;font-size:11pt}.invoice{margin:0;padding:0}
            </style></head><body>${invoiceElement.outerHTML}</body></html>`);
        frameDoc.close();
        setTimeout(() => { try { printFrame.contentWindow.focus(); printFrame.contentWindow.print(); console.log('[Client UF] iframe print issued.'); } catch(printError) { console.error('[Client UF] Error printing iframe:', printError); alert("Error trying to print."); } finally { setTimeout(() => { if (printFrame.parentNode) { document.body.removeChild(printFrame); console.log('[Client UF] iframe removed.'); } }, 500); } }, 250);
    } catch (error) { console.error('[Client UF] Error creating iframe:', error); alert("Error preparing print view."); if (printFrame && printFrame.parentNode) { document.body.removeChild(printFrame); } }
}

/** Handles print request, trying execCommand first, then iframe */
function handlePrintRequest() {
    console.log('[Client UF] Print button clicked. Preparing print...');
    // No internal details to toggle class for in UF version
    let printedViaExec = false;
    try {
        console.log("[Client UF] Trying document.execCommand('print')...");
        printedViaExec = document.execCommand('print', false, null);
        if (printedViaExec) { console.log("[Client UF] document.execCommand succeeded."); }
        else { console.log("[Client UF] document.execCommand returned false. Falling back to iframe print."); printViaIframe(); }
    } catch (err) {
        console.error("[Client UF] document.execCommand failed:", err);
        console.log("[Client UF] Falling back to iframe print due to error.");
        printViaIframe();
    }
}

/** Set up wizard navigation and button listeners */
function initializeWizard() {
    console.log('[Client UF] Initializing wizard UI...');
    const printBtnActual = document.getElementById('printEstimate'); // Get Print button

    wizard.addEventListener('click', (event) => { if (event.target.matches('.wizard-nav-btn.next') && currentStep !== 3) { navigateWizard('next'); } else if (event.target.matches('.wizard-nav-btn.prev')) { navigateWizard('prev'); } });
    if(addSectionBtn) addSectionBtn.addEventListener('click', handleAddSection);
    if(calculateBtn) calculateBtn.addEventListener('click', handleCalculate); // Use defined handleCalculate
    if(startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
    if(toggleExampleBtn) toggleExampleBtn.addEventListener('click', handleToggleExample);
    if(sectionsContainer) sectionsContainer.addEventListener('click', handleRemoveSection);

    // --- Attach COMBINED Print Handler ---
    if (printBtnActual) { printBtnActual.addEventListener('click', handlePrintRequest); }
    else { console.warn("[Client UF] Print Estimate button (#printEstimate) not found."); }

    steps.forEach((step, index) => { step.classList.remove('active', 'hiding'); if (index === currentStep - 1) { step.classList.add('active'); } });
    if(printButtonContainer) printButtonContainer.style.display = 'none';
    console.log('[Client UF] Wizard UI Initialized.');
}

/** Initial setup */
function main() {
    console.log('[Client UF] DOM Loaded. App initializing...');
    wizard = document.getElementById('wizard'); steps = wizard?.querySelectorAll('.wizard-step'); sectionsContainer = document.getElementById('sectionsContainer'); addSectionBtn = document.getElementById('addSectionBtn'); calculateBtn = document.getElementById('calculateBtn'); resultsDiv = document.getElementById('results'); startOverBtn = document.getElementById('startOverBtn'); printButtonContainer = document.getElementById('printButtonContainer'); toggleExampleBtn = document.getElementById('toggleExampleBtn'); exampleImageDiv = document.getElementById('exampleImage'); themeToggleBtn = document.getElementById('themeToggleBtn');
    const criticalElements = [wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printButtonContainer, toggleExampleBtn, exampleImageDiv, themeToggleBtn];
    if (!steps || steps.length === 0 || criticalElements.some(el => !el)) { console.error("[Client UF] Critical UI elements missing."); document.body.innerHTML = '<p style="color: red; font-weight: bold; padding: 2em;">Error: UI incomplete.</p>'; return; }
    themeToggleBtn.addEventListener('click', handleThemeToggle);
    loadInitialTheme();
    initPricingData(); // Calls initializeWizard after data load
}

// --- Run main setup ---
document.addEventListener('DOMContentLoaded', main);