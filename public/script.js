/* --- FILE: public/style.css --- */

/* Reset and Base Styles Inspired by Style6.css */
* {
    border: 0;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}
:root {
     --primary-color-style6: #26c6da; /* Tealish Blue */
     --secondary-color-style6: #ef5350; /* Reddish */
     --text-color-style6: #555; /* Dark Grey text */
     --text-color-light-style6: #757575; /* Lighter Grey */
     --bg-color-forms: #eee; /* Form background */
     /* --- Updated Background --- */
     --bg-color-main: #dde1e4;   /* Slightly Darker Grey */
     --bg-gradient: linear-gradient(135deg, #cfd8dc 0%, #607d8b 100%, #b0bec5 100%);
     /* --- Updated Shadows --- */
     --shadow-convex-outer: 6px 6px 12px #babecc, -6px -6px 12px #feffff; /* Adjusted shadow */
     --shadow-inset: inset 5px 5px 10px #babecc, inset -5px -5px 10px #feffff; /* Adjusted inset shadow */

     --border-radius-container: 10px; /* Consistent radius */
     --border-radius-button: 8px; /* Button radius */
     --border-radius-input: 8px; /* Input radius */
     --transition-duration: 0.4s; /* Smoother transition */

     /* --- Dark Theme Variables --- */
     --bg-color-main-dark: #2a2a2e;
     --bg-color-forms-dark: #3a3a3e;
     --text-color-style6-dark: #e0e0e0;
     --text-color-light-style6-dark: #b0b0b0;
     --shadow-convex-outer-dark: 6px 6px 12px #222224, -6px -6px 12px #323236;
     --shadow-inset-dark: inset 5px 5px 10px #222224, inset -5px -5px 10px #323236;
     --primary-color-style6-dark: #36d7ed; /* Slightly brighter teal for dark */
     --secondary-color-style6-dark: #ff6f6b; /* Slightly brighter red for dark */
}

html {
    height: 100%;
}

body {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column; /* Stack header and wizard */
    align-items: center; /* Center direct children horizontally */
    padding: 2em;
    background: var(--bg-color-main); /* Solid background using variable */
    font-family: 'Poppins', sans-serif;
    color: var(--text-color-style6);
    font-size: 16px;
    line-height: 1.5; /* Improved line height */
    transition: background-color 0.3s ease, color 0.3s ease; /* Theme transition */
}

/* Header */
header {
    display: flex;
    /* justify-content: space-between; */ /* Removed for auto margin */
    align-items: center;
    width: 100%;
    max-width: 900px; /* Max width */
    margin: 0 auto 2em auto; /* Center and add bottom margin */
    padding-bottom: 1em;
    border-bottom: 1px solid #ddd; /* Subtle separator */
    flex-wrap: wrap;
    box-sizing: border-box;
    gap: 1em; /* Add gap between items */
    transition: border-color 0.3s ease;
}
header h1 {
    font-weight: 900;
    font-size: 1.8em;
    color: var(--primary-color-style6);
    letter-spacing: 0.5px;
    margin: 0;
    margin-right: auto; /* Push toggle button to the right */
    transition: color 0.3s ease;
}
header img {
    height: 45px; /* Adjusted size */
    width: auto;
    display: block;
    max-height: 45px;
    flex-shrink: 0; /* Prevent logo shrinking */
}

/* Theme Toggle Button Specific Style (already in HTML, added here for clarity) */
#themeToggleBtn {
    margin-left: auto; /* Pushes it to the far right */
    height: 35px;
    width: 50px;
    font-size: 1.2em;
    padding: 0;
    background: #d1d9e6; /* Light theme specific */
    color: var(--text-color-light-style6); /* Light theme specific */
    box-shadow: 3px 3px 6px #b8c1d1, -3px -3px 6px #ffffff; /* Light theme specific */
    border-radius: var(--border-radius-button);
    cursor: pointer;
    display: flex; /* Center icon */
    align-items: center; /* Center icon */
    justify-content: center; /* Center icon */
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    margin-top: 0; /* Ensure no extra top margin */
}

/* Wizard Container */
#wizard {
    position: relative;
    width: 100%;
    max-width: 900px; /* Max width */
    background-color: var(--bg-color-forms); /* Use form background */
    border-radius: var(--border-radius-container);
    box-shadow: var(--shadow-convex-outer);
    overflow: hidden; /* Hide overflowing steps */
    margin-bottom: 2em;
    padding: 0; /* Remove padding here, add to steps */
    box-sizing: border-box;
    min-height: 500px; /* Adjust as needed - Moved from inline style */
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

/* Wizard Step Styling & Transition */
.wizard-step {
   width: 100%;
   position: absolute;
   top: 0;
   left: 0;
   padding: 30px 40px; /* Padding inside step */
   box-sizing: border-box;
   background-color: var(--bg-color-forms); /* Match container */
   opacity: 0;
   visibility: hidden;
   transform: translateX(30px); /* Start slightly off-screen right */
   transition: opacity var(--transition-duration) ease-out,
               transform var(--transition-duration) ease-out,
               visibility 0s linear var(--transition-duration),
               background-color 0.3s ease; /* Added theme transition */
}
.wizard-step.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
    position: relative; /* Take space */
    transition: opacity var(--transition-duration) ease-out,
                transform var(--transition-duration) ease-out,
                visibility 0s linear 0s,
                background-color 0.3s ease;
}
.wizard-step.hiding {
    opacity: 0;
    visibility: visible; /* Keep visible during out transition */
    transform: translateX(-30px); /* Slide out left */
    position: absolute; /* Don't affect layout */
    transition: opacity var(--transition-duration) ease-out,
                transform var(--transition-duration) ease-out,
                visibility 0s linear var(--transition-duration),
                background-color 0.3s ease;
}


.step-title {
    font-weight: 900; /* Bolder title */
    margin-top: 0; /* Remove top margin */
    margin-bottom: 1em;
    color: var(--primary-color-style6);
    font-size: 1.6rem;
    letter-spacing: 0.5px;
    text-align: center; /* Centered title */
    transition: color 0.3s ease;
}
 .step-instructions {
    font-weight: 400;
    margin-bottom: 1.5em;
    color: var(--text-color-light-style6);
    font-size: 1em;
    line-height: 1.5;
    text-align: center;
    transition: color 0.3s ease;
 }
 .step-navigation {
     display: flex;
     justify-content: space-between;
     margin-top: 2.5em; /* More space above nav */
     padding-top: 1.5em;
     border-top: 1px solid #ccc; /* Slightly darker separator */
     transition: border-color 0.3s ease;
 }
 .step-indicator {
     text-align: center;
     margin-bottom: 1.5em; /* More space */
     font-weight: 600;
     color: var(--primary-color-style6);
     opacity: 0.7;
     font-size: 0.9em;
     transition: color 0.3s ease;
 }

/* Example Image Toggle/Container */
#exampleImageContainer { margin-bottom: 1.5em; text-align: center; }
#toggleExampleBtn { margin-bottom: 1em; }
#exampleImage { text-align: center; margin-top: 1em; display: none; }
#exampleImage img { max-width: 90%; height: auto; border-radius: 10px; box-shadow: var(--shadow-convex-outer); transition: box-shadow 0.3s ease; } /* Outset shadow */

/* Form Sections Styling */
.part, .section {
    background-color: #f8f8f8; /* Consistent background */
    padding: 20px;
    margin-bottom: 20px;
    border-radius: var(--border-radius-container);
    box-shadow: var(--shadow-inset);
    text-align: left;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
}
#roughEstimateContainer h2, .part h2 { /* Merged selectors */
     font-size: 1.1rem;
     font-weight: 600;
     color: var(--primary-color-style6);
     margin-bottom: 1em;
     padding-bottom: 0.3em;
     border-bottom: 1px solid #ddd;
     text-align: left;
     transition: color 0.3s ease, border-color 0.3s ease;
}

/* Sections Container & Individual Section */
#sectionsContainer {
    display: flex; flex-wrap: wrap; gap: 1.5em;
    margin-bottom: 1.5em; justify-content: center; /* Changed from flex-row class to direct style */
}
.section {
    flex-grow: 0; flex-shrink: 1;
    flex-basis: calc(25% - 1.15em); /* Adjusted basis for gap */
    max-width: calc(25% - 1.15em); /* Adjusted max-width for gap */
    min-width: 280px; /* Min width */
    box-sizing: border-box;
    padding: 15px;
}
 .section-header {
     display: flex;
     justify-content: space-between; /* Puts button on the right */
     align-items: center;
     margin-bottom: 1em;
 }
 .section-id {
     font-weight: 600;
     font-size: 0.9em;
     color: #fff;
     background-color: var(--primary-color-style6);
     padding: 3px 8px;
     border-radius: 5px;
     margin-right: auto; /* Push button away */
     transition: background-color 0.3s ease;
 }
 #addSectionBtn { margin-top: 0; display: block; margin-left: auto; margin-right: auto; width: auto; padding: 0 25px;} /* Center add button */

/* General Form Elements */
label, input, button, select { display: block; width: 100%; padding: 0; border: none; outline: none; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
label { margin-bottom: 6px; font-size: 0.85em; font-weight: 600; color: #666; text-align: left; padding-left: 10px; transition: color 0.3s ease;}
label:not(:first-child) { margin-top: 15px; }
input::placeholder { color: #aaa; }
input[type="number"], select {
    background: var(--bg-color-forms); /* Use form background for inputs */
    padding: 10px 20px; /* Adjusted padding */
    height: 50px;
    font-size: 14px;
    border-radius: var(--border-radius-input);
    box-shadow: var(--shadow-inset);
    color: var(--text-color-style6);
    text-align: left;
    margin-top: 0; /* Reset margin-top */
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    border: 1px solid transparent; /* Placeholder for dark mode border */
}
 input[type="number"]:focus, select:focus {
     box-shadow: var(--shadow-inset), 0 0 0 2px rgba(38, 198, 218, 0.3); /* Focus ring */
     /* Keep transition for focus ring color if needed */
 }
 select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23777' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 15px center; background-size: 16px 12px; padding-right: 40px; cursor: pointer; transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-image 0.3s ease; } /* Added background-image transition */

/* Button Styles */
button {
    color: white;
    margin-top: 20px;
    background: var(--primary-color-style6);
    height: 45px; /* Slightly taller */
    border-radius: var(--border-radius-button);
    cursor: pointer;
    font-weight: 900; /* Bolder */
    box-shadow: var(--shadow-convex-outer);
    transition: 0.3s ease; /* Keep general transition */
    font-size: 0.9em;
    letter-spacing: 0.5px;
}
button:hover:not(:disabled) { /* Add :not(:disabled) */
    box-shadow: none;
    filter: brightness(1.1);
}
button:active:not(:disabled) { /* Add active state */
    filter: brightness(0.95);
    box-shadow: var(--shadow-inset); /* Press effect */
}
button:disabled {
    background: #ccc !important;
    box-shadow: var(--shadow-inset);
    cursor: not-allowed;
    color: #888 !important; /* Ensure text color changes */
    filter: none !important; /* Remove any filters */
    opacity: 0.7;
}

/* Specific Buttons */
#addSectionBtn, .wizard-nav-btn, #calculateBtn, #toggleExampleBtn, #startOverBtn, #printEstimate { width: auto; padding-left: 25px; padding-right: 25px; display: inline-block; } /* Removed #toggleDetailsBtn */
.wizard-nav-btn.prev, #startOverBtn { background: #b0bec5; box-shadow: 6px 6px 6px #a0acb1, -6px -6px 6px #c0ced3; color: #546e7a;}
.wizard-nav-btn.prev:hover:not(:disabled), #startOverBtn:hover:not(:disabled) { box-shadow: none; filter: brightness(1.05); }
#calculateBtn { font-size: 1.1em; display: block; margin: 0 auto;} /* Centered Calculate button */
#formActions { margin-top: 2em; text-align: center; } /* Container for calc button */

#toggleExampleBtn { /* Removed #toggleDetailsBtn */
    margin-top: 0;
    height: 35px;
    font-size: 0.8em;
    background: #d1d9e6;
    color: var(--text-color-light-style6);
    /* Corrected convex shadow for lighter bg */
    box-shadow: 3px 3px 6px #b8c1d1, -3px -3px 6px #ffffff;
    font-weight: 600;
}
#toggleExampleBtn:hover:not(:disabled) { box-shadow: none; filter: brightness(1.05); } /* Removed #toggleDetailsBtn */
#toggleExampleBtn:active:not(:disabled) { box-shadow: inset 2px 2px 4px #b8c1d1, inset -2px -2px 4px #ffffff; } /* Inset press effect - Removed #toggleDetailsBtn */


button.remove-button {
    background: var(--secondary-color-style6);
    color: white;
    height: 30px;
    width: 30px; /* Make it square */
    padding: 0; /* Remove padding */
    font-size: 1.2em; /* Larger X */
    line-height: 28px; /* Vertically center X */
    font-weight: 600;
    margin-top: 0; /* Align with section title */
    margin-left: 10px; /* Space from title */
    box-shadow: 3px 3px 3px #d89997, -3px -3px 3px #ffadab;
    border-radius: 50%; /* Make it round */
    display: inline-block; /* Needed for alignment */
    text-align: center;
}
button.remove-button:hover:not(:disabled) { box-shadow: none; filter: brightness(1.1); }
button.remove-button:active:not(:disabled) { filter: brightness(0.9); box-shadow: inset 1px 1px 2px #b43b39, inset -1px -1px 2px #ff6f6c;}


/* Results & Invoice */
#results { margin-top: 2em; background: transparent; border: none; padding: 0; overflow-x: visible; width: 100%; } /* Ensure results takes width */
.invoice {
    width: 100%; /* Make invoice take width of container */
    max-width: 900px; /* Match wizard width */
    min-width: 300px; /* Adjust min-width */
    margin: 0 auto; /* Center invoice */
    padding: 2em;
    border-radius: var(--border-radius-container);
    background: var(--bg-color-main); /* Match body bg */
    box-shadow: var(--shadow-convex-outer);
    color: var(--text-color-style6);
    border: none;
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}
.invoice-header { text-align: center; margin-bottom: 1.5em; padding-bottom: 1.5em; border-bottom: 1px solid #d1d9e6; transition: border-color 0.3s ease; }
.invoice-header h1 { color: var(--primary-color-style6); margin-bottom: 0.2em; font-size: 1.8em; font-weight: 900; transition: color 0.3s ease; }
.invoice-header p { font-size: 0.9em; color: #777; transition: color 0.3s ease; }
.invoice h3 { font-size: 1.3em; color: var(--primary-color-style6); margin-bottom: 1em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; font-weight: 900; text-align: left; transition: color 0.3s ease, border-color 0.3s ease; } /* Changed to left align, added border */
.summary-table, .details-table { width: 100%; border-collapse: separate; border-spacing: 0 0.5em; margin-bottom: 1.5em; }
.summary-table td, .details-table td, .details-table th { padding: 0.8em 1em; border-bottom: none; vertical-align: middle; transition: color 0.3s ease; } /* Added th */
.summary-table tr, .details-table tr { background: #f8f8f8; border-radius: var(--border-radius-input); box-shadow: var(--shadow-inset); transition: background-color 0.3s ease, box-shadow 0.3s ease;}
.summary-table .table-label, .details-table th { /* Use th for details header */
    text-align: left; padding-right: 1em; color: #555; font-weight: 600;
}
.summary-table .table-value, .details-table td { /* Apply to all td in details */
    text-align: right; font-weight: 600; color: #555; /* Normal weight for details */
}
.details-table thead { background: none; box-shadow: none; } /* Style thead separately */
.details-table thead th { background: #e0e0e0; color: #333; padding: 0.6em 1em; font-size: 0.9em; border-radius: 5px 5px 0 0; transition: background-color 0.3s ease, color 0.3s ease;}
.details-table td:first-child { text-align: center; font-weight: normal;} /* Center section number */
.details-table td:last-child { font-weight: 700; color: #333; transition: color 0.3s ease;} /* Bold cost */


.summary-table tfoot { border-top: 2px solid #ccc; margin-top: 1em; transition: border-color 0.3s ease;}
.summary-table tfoot tr { background: none; box-shadow: none; } /* Remove background from footer row */
.summary-table tfoot td { border-bottom: none; padding-top: 1em; }
.summary-table .total-row td { font-size: 1.2em; font-weight: 900; color: var(--primary-color-style6); padding-top: 1em; background: none; box-shadow: none; transition: color 0.3s ease;}
/* Removed .details-section styles as it's no longer separate */
.details-table td { padding: 0.5em 0.8em; font-size: 0.9em; }
.details-table tbody tr { border-radius: 0.6em; background: #fff; box-shadow: inset 2px 2px 3px #ddd, inset -2px -2px 3px #fff; transition: background-color 0.3s ease, box-shadow 0.3s ease;}
/* Removed #toggleDetailsBtn styles */
.estimate-footer { text-align: center; margin-top: 2em; font-size: 0.85em; color: #777; transition: color 0.3s ease;}
#printButtonContainer { margin-top: 1.5em; text-align: center; display: none; } /* Hidden by default */
#printEstimate { padding: 0.8em 1.5em; font-size: 1em; width: auto; }
small { display: block; font-size: 0.85em; color: #888; margin-top: 5px; margin-left: 5px; line-height: 1.3; text-align: left; transition: color 0.3s ease;}
.invoice-error { padding: 1em; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px; margin: 1em auto; max-width: 95%; transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;} /* Use % width */
.invoice-error p { margin: 0.2em 0; }
.invoice-loading { text-align:center; padding: 2em; color: var(--text-color-light-style6); font-style: italic; transition: color 0.3s ease; }

/* --- Dark Theme Application --- */
body[data-theme="dark"] {
    /* Override base colors */
    --bg-color-main: var(--bg-color-main-dark);
    --bg-color-forms: var(--bg-color-forms-dark);
    --text-color-style6: var(--text-color-style6-dark);
    --text-color-light-style6: var(--text-color-light-style6-dark);
    color: var(--text-color-style6-dark); /* Apply base text color */
    background: var(--bg-color-main-dark); /* Apply base background */

    /* Override shadows */
    --shadow-convex-outer: var(--shadow-convex-outer-dark);
    --shadow-inset: var(--shadow-inset-dark);

    /* Optional: Override accent colors */
    --primary-color-style6: var(--primary-color-style6-dark);
    --secondary-color-style6: var(--secondary-color-style6-dark);
}

/* Specific element overrides for dark theme */
body[data-theme="dark"] header {
    border-bottom-color: #444; /* Darker border */
}
/* Style for the toggle button itself in dark mode */
body[data-theme="dark"] #themeToggleBtn {
    background: #4a5a6a;
    color: #ddd;
    box-shadow: var(--shadow-convex-outer-dark); /* Use dark theme shadow */
}
body[data-theme="dark"] #wizard {
    background-color: var(--bg-color-forms-dark);
    box-shadow: var(--shadow-convex-outer-dark);
}
body[data-theme="dark"] .wizard-step {
     background-color: var(--bg-color-forms-dark);
}
body[data-theme="dark"] .step-title,
body[data-theme="dark"] .step-indicator {
    color: var(--primary-color-style6-dark);
}
body[data-theme="dark"] .step-instructions {
    color: var(--text-color-light-style6-dark);
}
body[data-theme="dark"] .step-navigation {
    border-top-color: #555;
}
body[data-theme="dark"] .part,
body[data-theme="dark"] .section {
    background-color: #333; /* Slightly darker form section */
    box-shadow: var(--shadow-inset-dark);
}
body[data-theme="dark"] .part h2 {
     color: var(--primary-color-style6-dark);
     border-bottom-color: #555;
}
 body[data-theme="dark"] label {
     color: #bbb;
 }
 body[data-theme="dark"] input[type="number"],
 body[data-theme="dark"] select {
     background: var(--bg-color-forms-dark); /* Keep existing background color */
     color: var(--text-color-style6-dark); /* Keep existing text color */
     box-shadow: var(--shadow-inset-dark); /* Keep existing shadow */
     border: 1px solid #555; /* Keep existing border */
     background-image: none; /* Remove the custom arrow SVG */
     padding-right: 20px; /* Reset padding to match number inputs */
 }
 body[data-theme="dark"] input[type="number"]:focus,
 body[data-theme="dark"] select:focus {
     box-shadow: var(--shadow-inset-dark), 0 0 0 2px rgba(54, 215, 237, 0.4); /* Adjust focus ring color */
 }
  /* Removed dark mode select arrow override as background-image: none handles it */
  body[data-theme="dark"] button {
       background: var(--primary-color-style6-dark);
       box-shadow: var(--shadow-convex-outer-dark);
       color: #111; /* Darker text on lighter button */
  }
   body[data-theme="dark"] button:hover:not(:disabled) {
       filter: brightness(1.1);
       box-shadow: none;
   }
   body[data-theme="dark"] button:active:not(:disabled) { /* Dark theme active state */
        filter: brightness(0.95);
        box-shadow: var(--shadow-inset-dark); /* Press effect */
    }
   body[data-theme="dark"] button:disabled {
       background: #555 !important;
       color: #999 !important;
       box-shadow: var(--shadow-inset-dark);
   }
   body[data-theme="dark"] button.remove-button {
       background: var(--secondary-color-style6-dark);
       /* Adjust shadow for dark theme remove button */
       box-shadow: 3px 3px 3px #7e2c2a, -3px -3px 3px #a04c49;
       color: #fff;
   }
    body[data-theme="dark"] button.remove-button:active:not(:disabled) {
        filter: brightness(0.9);
        box-shadow: inset 1px 1px 2px #6f2624, inset -1px -1px 2px #b35b58; /* Dark theme inset */
    }
   body[data-theme="dark"] button.wizard-nav-btn.prev,
   body[data-theme="dark"] #startOverBtn {
        background: #5a6a72;
        box-shadow: 6px 6px 6px #49565c, -6px -6px 6px #6b7e88;
        color: #ddd;
   }
    body[data-theme="dark"] #toggleExampleBtn {
         background: #4a5a6a;
         color: #ddd;
         box-shadow: var(--shadow-convex-outer-dark);
    }
     body[data-theme="dark"] #toggleExampleBtn:active:not(:disabled) {
         box-shadow: var(--shadow-inset-dark);
     }
    body[data-theme="dark"] .invoice {
         background: var(--bg-color-main-dark);
         box-shadow: var(--shadow-convex-outer-dark);
         color: var(--text-color-style6-dark);
    }
    body[data-theme="dark"] .invoice-header { border-bottom-color: #555; }
    body[data-theme="dark"] .invoice-header h1 { color: var(--primary-color-style6-dark); }
    body[data-theme="dark"] .invoice-header p { color: #aaa; }
    body[data-theme="dark"] .invoice h3 { color: var(--primary-color-style6-dark); border-bottom-color: #555; }
    body[data-theme="dark"] .summary-table tr,
    body[data-theme="dark"] .details-table tr {
         background: #3f3f43; /* Darker table row */
         box-shadow: var(--shadow-inset-dark);
    }
    body[data-theme="dark"] .summary-table .table-label,
    body[data-theme="dark"] .details-table th {
         color: #ccc;
    }
     body[data-theme="dark"] .summary-table .table-value,
     body[data-theme="dark"] .details-table td {
          color: #ddd;
     }
     body[data-theme="dark"] .details-table td:last-child { color: #eee; } /* Slightly brighter cost */
     body[data-theme="dark"] .summary-table tfoot { border-top-color: #666; }
     body[data-theme="dark"] .summary-table .total-row td { color: var(--primary-color-style6-dark); }
     body[data-theme="dark"] .details-table thead th { background: #4f4f53; color: #fff; }
     body[data-theme="dark"] .details-table tbody tr { background: #454549; box-shadow: inset 2px 2px 3px #333, inset -2px -2px 3px #555;}
     body[data-theme="dark"] .estimate-footer { color: #aaa; }
     body[data-theme="dark"] small { color: #999; }
     body[data-theme="dark"] .invoice-error { background-color: #582a2e; color: #f5c6cb; border-color: #a04a4e; }
     body[data-theme="dark"] .invoice-loading { color: var(--text-color-light-style6-dark); }

/* Responsive Table Wrapper */
.table-responsive-wrapper {
    width: 100%; /* Take full width of its container */
    overflow-x: auto; /* Enable horizontal scrolling ONLY when content overflows */
    -webkit-overflow-scrolling: touch; /* Smoother scrolling on iOS */
    margin-bottom: 1em; /* Add some space below the scrolling area */
}

/* Optional: Minor adjustments to table within wrapper if needed */
.table-responsive-wrapper .details-table {
    min-width: 600px; /* Example: Set a minimum width for the table itself */
                      /* This forces the wrapper to scroll sooner on small screens */
                      /* Adjust this value based on your content */
    margin-bottom: 0; /* Remove bottom margin from table if wrapper has it */
}


/* Responsive */
@media (max-width: 1200px) { /* Add breakpoint for wider screens */
     .section {
         flex-basis: calc(33.33% - 1em); /* 3 columns */
         max-width: calc(33.33% - 1em);
     }
}

@media (max-width: 992px) { /* Tablet */
     .section {
         flex-basis: calc(50% - 0.75em); /* 2 columns */
         max-width: calc(50% - 0.75em);
     }
     .invoice { max-width: 90%; }
}

@media (max-width: 768px) { /* Smaller tablet / large phone */
    body { padding: 1em; }
    header { flex-direction: row; gap: 0.5em; text-align: left; align-items: center;} /* Adjusted header for mobile */
    header h1 { font-size: 1.2em; margin-right: auto; } /* Adjust H1 size */
    header img { height: 35px; max-height: 35px;}
    #themeToggleBtn { width: 40px; height: 30px; font-size: 1em; } /* Smaller theme button */
    #wizard { padding: 20px; max-width: 95%; min-height: 450px; } /* Adjust height */
    .section {
         flex-basis: 100%; /* Stack sections */
         max-width: 100%;
         min-width: 0; /* Let it shrink */
     }
    .step-navigation { flex-direction: column; gap: 0.8em; align-items: center;}
    .wizard-nav-btn { width: 100%; max-width: 250px; }
     #addSectionBtn, #toggleExampleBtn, #startOverBtn, #printEstimate { width: 100%; max-width: 250px; margin-left: auto; margin-right: auto; display: block;} /* Center toggle buttons */
     button.remove-button { width: 28px; height: 28px; font-size: 1em; line-height: 26px; } /* Slightly smaller remove */
    .invoice { max-width: 95%; padding: 1.5em; }
    .summary-table td, .details-table td, .details-table th { padding: 0.6em 0.8em; } /* Adjust padding */
}

@media (max-width: 480px) { /* Small phone */
     body { padding: 0.5em; }
     header h1 { font-size: 1.1em; } /* Further reduce h1 */
     .wizard-step { padding: 20px 15px; } /* Reduce horizontal padding */
     .step-title { font-size: 1.4rem; }
     input[type="number"], select { height: 45px; padding: 8px 15px; font-size: 13px; }
     button { height: 40px; font-size: 0.9em;}
     label { font-size: 0.85em;}
     small { font-size: 0.8em;}
     .invoice { padding: 1em; }
     .summary-table td, .details-table td, .details-table th { padding: 0.5em; font-size: 0.9em; } /* Further adjust padding/size */
     .summary-table .total-row td { font-size: 1.1em; }
}

/* Print Styles */
/* --- FILE: public/style.css (FINAL @media print section) --- */

@media print {
    /* Basic page setup */
    @page {
      size: A4; /* Or letter */
      margin: 1cm;
    }
    body {
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: Arial, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.3;
         -webkit-print-color-adjust: exact !important;
         print-color-adjust: exact !important;
         height: auto !important;
         width: auto !important;
         overflow: visible !important; /* Ensure body doesn't clip */
    }

    /* --- Hide unwanted elements explicitly --- */
    header, #wizard .step-navigation, #wizard .step-indicator, #exampleImageContainer, #addSectionBtn, #calculateBtn, .remove-button, #formActions, #printButtonContainer, #startOverBtn, #themeToggleBtn, small {
        display: none !important;
        visibility: hidden !important;
    }
    /* --- Override Wizard container styles FOR PRINT --- */
    #wizard {
        display: block !important;
        visibility: visible !important;
        overflow: visible !important; /* Allow content to overflow */
        position: static !important;
        box-shadow: none !important;
        border: none !important;
        background: none !important;
        min-height: auto !important;
        height: auto !important;
        width: auto !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    /* --- Hide all wizard steps first --- */
     .wizard-step {
       display: none !important;
       visibility: hidden !important;
     }
    /* --- Override Step-4 container styles FOR PRINT --- */
    #step-4 {
        display: block !important;
        visibility: visible !important;
        overflow: visible !important; /* Allow content to overflow */
        position: static !important;
        opacity: 1 !important;
        transform: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: none !important;
        width: auto !important;
        height: auto !important;
    }

    /* Ensure the results container itself is visible */
    #results {
        display: block !important;
        visibility: visible !important;
        margin: 0;
        padding: 0;
        border: none;
        width: 100%;
        overflow: visible !important;
    }

    /* Invoice container styling - Plain look */
    .invoice {
        visibility: visible !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important; /* No extra padding on invoice wrapper */
        border: none !important; /* Use internal borders instead */
        box-shadow: none !important;
        background: white !important;
        color: black !important;
        border-radius: 0 !important;
        font-size: 10pt !important;
        position: static !important; /* Ensure static positioning */
        overflow: visible !important; /* Ensure visible overflow */
    }

    /* Ensure all direct children of the invoice are visible */
    .invoice > * {
        visibility: visible !important;
    }

    /* Invoice Header */
    .invoice-header {
        text-align: center;
        border-bottom: 2px solid black !important;
        padding-bottom: 0.8em !important;
        margin-bottom: 1.5em !important;
        color: black !important; /* Explicit color */
    }
    .invoice-header img.invoice-logo { display: block !important; max-height: 60px; margin: 0 auto 0.5em auto;} /* Show logo if needed */
    .invoice-header h1 {
        font-size: 16pt !important;
        font-weight: bold !important;
        color: black !important;
        margin-bottom: 0.1em !important;
    }
     .invoice-header p {
         font-size: 9pt !important;
         color: black !important; /* Explicit color */
         margin: 0.2em 0 !important;
     }

    /* Section Titles inside Invoice */
    .invoice h3 {
        font-size: 12pt !important;
        font-weight: bold !important;
        color: black !important; /* Explicit color */
        margin-top: 1.2em !important;
        margin-bottom: 0.6em !important;
        border-bottom: 1px solid #666 !important; /* Subtler border */
        padding-bottom: 0.2em !important;
        text-align: left !important;
        page-break-after: avoid !important;
    }
    .invoice h3:first-of-type { margin-top: 0 !important; }

    /* Table Styling */
    .invoice table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 1.5em !important;
        font-size: 9pt !important;
        border-spacing: 0 !important;
        page-break-inside: auto;
    }
    .invoice th, .invoice td {
        border: 1px solid #ccc !important; /* Light grey borders */
        padding: 5px 8px !important;
        text-align: left !important;
        vertical-align: top !important;
        color: black !important; /* Explicit color */
        background: white !important; /* Explicit background */
        box-shadow: none !important;
    }
    .invoice thead th {
        background-color: #eee !important; /* Light grey header */
        font-weight: bold !important;
        border-bottom: 1px solid #999 !important;
        color: black !important; /* Explicit color */
        page-break-inside: avoid !important;
    }
     .invoice tbody tr {
         page-break-inside: avoid !important;
     }
    /* Responsive Table Wrapper styling for print (should be hidden by default, but ensures no weird display) */
    .table-responsive-wrapper {
       overflow-x: visible !important; /* Do NOT scroll horizontally in print */
       width: 100% !important;
       margin-bottom: 1em !important; /* Keep margin */
    }
    .invoice .table-responsive-wrapper .details-table {
       min-width: 0 !important; /* Allow table to shrink naturally in print */
       width: 100% !important; /* Ensure it takes full width */
    }

    .invoice .details-table td:nth-child(1), /* Section # */
    .invoice .details-table td:nth-child(5), /* HxW */
    .invoice .details-table td:nth-child(6) { /* Area */
        text-align: center !important;
    }
    .invoice .details-table td:nth-child(7), /* Cost */
    .invoice .summary-table .table-value {
        text-align: right !important;
        font-weight: normal !important; /* Normal weight for values */
    }
    /* Make cost column slightly bolder if desired */
    .invoice .details-table td:nth-child(7) {
         font-weight: 600 !important;
    }

    .invoice .summary-table .table-label {
        font-weight: normal !important; /* Normal weight for labels */
        width: 70%;
        border-right: none !important; /* Remove border between label/value */
    }
     .invoice .summary-table .table-value {
        border-left: none !important; /* Remove border between label/value */
     }

    /* Totals Row Styling */
    .invoice tfoot { border-top: none !important; }
    .invoice .summary-table tfoot tr { page-break-inside: avoid !important; }
    .invoice .total-row {
        background-color: white !important; /* White background */
        border-top: 2px solid black !important; /* Bold top border */
    }
    .invoice .total-row td {
        font-weight: bold !important;
        font-size: 11pt !important;
        border: none !important; /* Remove cell borders for total */
        border-top: 2px solid black !important; /* Keep matching top border */
        padding: 6px 8px !important;
        color: black !important;
    }
    .invoice .total-row .table-label {
        text-align: right !important;
        width: auto !important;
        padding-right: 1em;
    }
    .invoice .total-row .table-value {
        text-align: right !important;
    }


    /* Footer */
    .estimate-footer {
        text-align: center !important;
        margin-top: 2em !important;
        padding-top: 1em !important;
        border-top: 1px solid #ccc !important;
        font-size: 8pt !important;
        color: #333 !important; /* Dark grey footer text */
        page-break-before: auto;
    }

     /* Ensure invoice errors are not printed */
     .invoice-error {
        display: none !important;
     }
}