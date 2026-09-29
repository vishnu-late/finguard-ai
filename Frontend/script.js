/**
 * FinGuard AI - Credit Risk Intelligence Platform
 * Frontend Client Engine & API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
    // API Configuration Base URL
    let API_BASE_URL = localStorage.getItem('finguard_api_url') || 'http://127.0.0.1:8000';

    // DOM Elements - Config & Status
    const apiUrlInput = document.getElementById('apiUrlInput');
    const apiStatusBadge = document.getElementById('apiStatusBadge');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const btnConfig = document.getElementById('btnConfig');
    const configModal = document.getElementById('configModal');
    const btnCloseConfig = document.getElementById('btnCloseConfig');
    const btnTestApi = document.getElementById('btnTestApi');
    const btnSaveConfig = document.getElementById('btnSaveConfig');
    const preflightThreshold = document.getElementById('preflightThreshold');

    // DOM Elements - Form & Submit
    const loanForm = document.getElementById('loanForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnContent = document.getElementById('btnContent');
    const btnSpinner = document.getElementById('btnSpinner');
    const loaderStepText = document.getElementById('loaderStepText');

    // Form Inputs & Sliders
    const ageInput = document.getElementById('person_age');
    const ageSlider = document.getElementById('person_age_slider');
    const ageValDisplay = document.getElementById('ageValDisplay');

    const incomeInput = document.getElementById('person_income');
    const incomeSlider = document.getElementById('person_income_slider');
    const incomeValDisplay = document.getElementById('incomeValDisplay');

    const empInput = document.getElementById('person_emp_length');
    const empSlider = document.getElementById('person_emp_length_slider');
    const empValDisplay = document.getElementById('empValDisplay');

    const homeSelect = document.getElementById('person_home_ownership');

    const loanInput = document.getElementById('loan_amnt');
    const loanSlider = document.getElementById('loan_amnt_slider');
    const loanValDisplay = document.getElementById('loanValDisplay');

    const rateInput = document.getElementById('loan_int_rate');
    const rateSlider = document.getElementById('loan_int_rate_slider');
    const rateValDisplay = document.getElementById('rateValDisplay');

    const intentSelect = document.getElementById('loan_intent');
    const gradeSelect = document.getElementById('loan_grade');

    const ratioInput = document.getElementById('loan_percent_income');
    const ratioValDisplay = document.getElementById('ratioValDisplay');
    const autoCalcBtn = document.getElementById('autoCalcBtn');

    const credHistInput = document.getElementById('cb_person_cred_hist_length');
    const credHistSlider = document.getElementById('cb_person_cred_hist_length_slider');
    const credHistValDisplay = document.getElementById('credHistValDisplay');

    // Preset Action Buttons
    const btnPresetLow = document.getElementById('btnPresetLow');
    const btnPresetHigh = document.getElementById('btnPresetHigh');
    const btnReset = document.getElementById('btnReset');

    // Panel & Result States DOM
    const emptyState = document.getElementById('emptyState');
    const resultCard = document.getElementById('resultCard');
    const decisionBanner = document.getElementById('decisionBanner');
    const bannerIcon = document.getElementById('bannerIcon');
    const bannerResultText = document.getElementById('bannerResultText');
    const bannerDescText = document.getElementById('bannerDescText');
    const gaugeFill = document.getElementById('gaugeFill');
    const gaugeValue = document.getElementById('gaugeValue');
    const thresholdBarFill = document.getElementById('thresholdBarFill');
    const thresholdLineMarker = document.getElementById('thresholdLineMarker');
    const thresholdValText = document.getElementById('thresholdValText');
    const resTimestamp = document.getElementById('resTimestamp');

    // Metrics DOM
    const metricProb = document.getElementById('metricProb');
    const metricStatus = document.getElementById('metricStatus');
    const metricThreshold = document.getElementById('metricThreshold');
    const metricInference = document.getElementById('metricInference');
    const factorsList = document.getElementById('factorsList');
    const jsonRequest = document.getElementById('jsonRequest');
    const jsonResponse = document.getElementById('jsonResponse');

    // Copy Buttons for Code Block
    const btnCopyReq = document.getElementById('btnCopyReq');
    const btnCopyRes = document.getElementById('btnCopyRes');

    // Toast Error DOM
    const errorNotification = document.getElementById('errorNotification');
    const errorServerUrl = document.getElementById('errorServerUrl');
    const btnErrorRetry = document.getElementById('btnErrorRetry');

    // Initial setup
    apiUrlInput.value = API_BASE_URL;

    // Helper: Currency Formatter
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    // Sync input <-> slider helper
    function bindInputSlider(input, slider, display, formatter) {
        input.addEventListener('input', () => {
            slider.value = input.value;
            if (display) display.textContent = formatter ? formatter(input.value) : input.value;
            autoCalculateRatio();
        });
        slider.addEventListener('input', () => {
            input.value = slider.value;
            if (display) display.textContent = formatter ? formatter(slider.value) : slider.value;
            autoCalculateRatio();
        });
    }

    // Auto Calculate Loan Percent Income (loan_amnt / person_income)
    function autoCalculateRatio() {
        const income = parseFloat(incomeInput.value) || 0;
        const loan = parseFloat(loanInput.value) || 0;
        if (income > 0) {
            const decimalVal = (loan / income).toFixed(4);
            ratioInput.value = decimalVal;
            const pctVal = (decimalVal * 100).toFixed(2);
            ratioValDisplay.textContent = `${pctVal}% (${decimalVal})`;
        }
    }

    // Bind all form field pairs
    bindInputSlider(ageInput, ageSlider, ageValDisplay, (v) => `${v} Yrs`);
    bindInputSlider(incomeInput, incomeSlider, incomeValDisplay, (v) => formatCurrency(v));
    bindInputSlider(empInput, empSlider, empValDisplay, (v) => `${parseFloat(v).toFixed(1)} Yrs`);
    bindInputSlider(loanInput, loanSlider, loanValDisplay, (v) => formatCurrency(v));
    bindInputSlider(rateInput, rateSlider, rateValDisplay, (v) => `${parseFloat(v).toFixed(1)}%`);
    bindInputSlider(credHistInput, credHistSlider, credHistValDisplay, (v) => `${v} Yrs`);

    ratioInput.addEventListener('input', () => {
        const val = parseFloat(ratioInput.value) || 0;
        const pct = (val * 100).toFixed(2);
        ratioValDisplay.textContent = `${pct}% (${val.toFixed(2)})`;
    });

    if (autoCalcBtn) {
        autoCalcBtn.addEventListener('click', () => {
            autoCalculateRatio();
            autoCalcBtn.style.transform = 'scale(0.95)';
            setTimeout(() => autoCalcBtn.style.transform = '', 150);
        });
    }

    // --- Backend Health Check ---
    async function checkBackendHealth() {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Connecting...';
        try {
            const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
            if (res.ok) {
                statusDot.className = 'status-dot pulse-green';
                statusText.textContent = 'AI Engine Online';
                hideErrorNotification();
                return true;
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            statusDot.className = 'status-dot pulse-red';
            statusText.textContent = 'API Offline';
            return false;
        }
    }

    // Ping on load
    checkBackendHealth();

    // Modal Control Events
    btnConfig.addEventListener('click', () => configModal.classList.add('open'));
    btnCloseConfig.addEventListener('click', () => configModal.classList.remove('open'));
    configModal.addEventListener('click', (e) => {
        if (e.target === configModal) configModal.classList.remove('open');
    });

    btnTestApi.addEventListener('click', async () => {
        API_BASE_URL = apiUrlInput.value.trim().replace(/\/$/, '');
        const isOnline = await checkBackendHealth();
        if (isOnline) {
            alert(`✅ Connection Successful!\nConnected to FastAPI server at: ${API_BASE_URL}`);
        } else {
            alert(`❌ Connection Failed!\nCould not reach FastAPI server at ${API_BASE_URL}.\nPlease check server startup.`);
        }
    });

    btnSaveConfig.addEventListener('click', () => {
        API_BASE_URL = apiUrlInput.value.trim().replace(/\/$/, '');
        localStorage.setItem('finguard_api_url', API_BASE_URL);
        checkBackendHealth();
        configModal.classList.remove('open');
    });

    // --- Preset Data Definitions ---
    const presets = {
        low: {
            person_age: 32,
            person_income: 85000,
            person_emp_length: 6.0,
            person_home_ownership: 'MORTGAGE',
            loan_intent: 'PERSONAL',
            loan_grade: 'A',
            loan_amnt: 10000,
            loan_int_rate: 7.5,
            cb_person_default_on_file: 'N',
            cb_person_cred_hist_length: 7
        },
        high: {
            person_age: 21,
            person_income: 18000,
            person_emp_length: 0.5,
            person_home_ownership: 'RENT',
            loan_intent: 'DEBTCONSOLIDATION',
            loan_grade: 'F',
            loan_amnt: 15000,
            loan_int_rate: 19.5,
            cb_person_default_on_file: 'Y',
            cb_person_cred_hist_length: 1
        }
    };

    function applyPreset(data) {
        ageInput.value = data.person_age; ageSlider.value = data.person_age; ageValDisplay.textContent = `${data.person_age} Yrs`;
        incomeInput.value = data.person_income; incomeSlider.value = data.person_income; incomeValDisplay.textContent = formatCurrency(data.person_income);
        empInput.value = data.person_emp_length; empSlider.value = data.person_emp_length; empValDisplay.textContent = `${data.person_emp_length.toFixed(1)} Yrs`;
        homeSelect.value = data.person_home_ownership;
        intentSelect.value = data.loan_intent;
        gradeSelect.value = data.loan_grade;
        loanInput.value = data.loan_amnt; loanSlider.value = data.loan_amnt; loanValDisplay.textContent = formatCurrency(data.loan_amnt);
        rateInput.value = data.loan_int_rate; rateSlider.value = data.loan_int_rate; rateValDisplay.textContent = `${data.loan_int_rate}%`;
        credHistInput.value = data.cb_person_cred_hist_length; credHistSlider.value = data.cb_person_cred_hist_length; credHistValDisplay.textContent = `${data.cb_person_cred_hist_length} Yrs`;

        const radio = document.querySelector(`input[name="cb_person_default_on_file"][value="${data.cb_person_default_on_file}"]`);
        if (radio) radio.checked = true;

        autoCalculateRatio();
    }

    btnPresetLow.addEventListener('click', () => applyPreset(presets.low));
    btnPresetHigh.addEventListener('click', () => applyPreset(presets.high));
    btnReset.addEventListener('click', () => applyPreset(presets.low));

    // --- Form Submit & Step-by-Step AI Progress ---
    loanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideErrorNotification();

        // Construct exact JSON payload for backend
        const payload = {
            person_age: parseInt(ageInput.value, 10),
            person_income: parseFloat(incomeInput.value),
            person_home_ownership: homeSelect.value,
            person_emp_length: parseFloat(empInput.value),
            loan_intent: intentSelect.value,
            loan_grade: gradeSelect.value,
            loan_amnt: parseFloat(loanInput.value),
            loan_int_rate: parseFloat(rateInput.value),
            loan_percent_income: parseFloat(ratioInput.value),
            cb_person_default_on_file: document.querySelector('input[name="cb_person_default_on_file"]:checked').value,
            cb_person_cred_hist_length: parseInt(credHistInput.value, 10)
        };

        jsonRequest.textContent = JSON.stringify(payload, null, 2);

        // UI Loading Transition
        btnSubmit.disabled = true;
        btnContent.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        // Multi-Step Loading Message Sequence
        const stepMessages = [
            "Analyzing Applicant Profile...",
            "Running XGBoost inference...",
            "Calculating default probability..."
        ];

        let messageIndex = 0;
        loaderStepText.textContent = stepMessages[0];
        const stepInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % stepMessages.length;
            loaderStepText.textContent = stepMessages[messageIndex];
        }, 350);

        try {
            // Actual API Call to FastAPI endpoint
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            clearInterval(stepInterval);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            jsonResponse.textContent = JSON.stringify(data, null, 2);

            // Render Result Dashboard
            renderResults(data, payload);

        } catch (err) {
            clearInterval(stepInterval);
            showErrorNotification(API_BASE_URL);
        } finally {
            btnSubmit.disabled = false;
            btnContent.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    });

    // --- Render Results UI ---
    function renderResults(data, payload) {
        emptyState.classList.add('hidden');
        resultCard.classList.remove('hidden');

        // Extract parameters from backend response
        const prob = data.default_probability;
        const probPct = (prob * 100).toFixed(2);
        const threshold = data.threshold || 0.6437;
        const thresholdPct = (threshold * 100).toFixed(2);
        const resultString = data.Result || (data.default_prediction === 1 ? "High Risk" : "Low Risk");
        const isHighRisk = resultString.toLowerCase().includes("high") || data.default_prediction === 1;

        // Update Decision Banner
        if (isHighRisk) {
            decisionBanner.className = 'decision-hero-banner banner-high-risk';
            bannerIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            bannerResultText.textContent = 'HIGH RISK';
            bannerDescText.textContent = 'Model detects elevated loan default probability exceeding safety cutoff thresholds.';
        } else {
            decisionBanner.className = 'decision-hero-banner banner-low-risk';
            bannerIcon.innerHTML = '<i class="fa-solid fa-shield-check"></i>';
            bannerResultText.textContent = 'LOW RISK';
            bannerDescText.textContent = 'Applicant meets credit standards with strong financial ratios and historical stability.';
        }

        // Timestamp
        resTimestamp.innerHTML = `<i class="fa-regular fa-clock"></i> ${new Date().toLocaleTimeString()}`;

        // Animate Semi-Circle Gauge (SVG arc dash offset: max dasharray is 235.6)
        const maxDash = 235.6;
        const targetOffset = maxDash - (Math.min(prob, 1) * maxDash);
        gaugeFill.style.strokeDashoffset = targetOffset;

        // Count up number animation
        animateCounter(gaugeValue, 0, parseFloat(probPct), 1000, '%');

        // Cutoff Threshold Bar positioning
        thresholdBarFill.style.width = `${Math.min(prob * 100, 100)}%`;
        thresholdLineMarker.style.left = `${Math.min(threshold * 100, 100)}%`;
        thresholdValText.textContent = `Cutoff: ${thresholdPct}%`;

        // 4 Analytics Metrics Cards
        metricProb.textContent = `${probPct}%`;
        metricStatus.textContent = resultString.toUpperCase();
        metricStatus.className = `analytics-val ${isHighRisk ? 'text-red' : 'text-green'}`;
        metricThreshold.textContent = `${thresholdPct}%`;
        metricInference.textContent = 'MODEL VERIFIED';

        // Preflight Threshold indicator sync
        if (preflightThreshold) preflightThreshold.textContent = `${thresholdPct}%`;

        // Render Applicant Factors Summary
        renderFactorsBreakdown(payload, isHighRisk);
    }

    // Counter Animation Helper
    function animateCounter(element, start, end, duration, suffix = '') {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = (progress * (end - start) + start).toFixed(2);
            element.textContent = `${current}${suffix}`;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Applicant Profile Factors Summary List
    function renderFactorsBreakdown(payload, isHighRisk) {
        factorsList.innerHTML = '';

        const factors = [
            {
                name: 'Annual Income',
                val: formatCurrency(payload.person_income),
                status: payload.person_income >= 50000 ? 'positive' : 'negative',
                icon: 'fa-dollar-sign'
            },
            {
                name: 'Loan Amount Requested',
                val: formatCurrency(payload.loan_amnt),
                status: payload.loan_amnt <= 20000 ? 'positive' : 'negative',
                icon: 'fa-hand-holding-dollar'
            },
            {
                name: 'Interest Rate',
                val: `${payload.loan_int_rate}%`,
                status: payload.loan_int_rate <= 12 ? 'positive' : 'negative',
                icon: 'fa-percent'
            },
            {
                name: 'Assigned Risk Grade',
                val: `Grade ${payload.loan_grade}`,
                status: ['A', 'B', 'C'].includes(payload.loan_grade) ? 'positive' : 'negative',
                icon: 'fa-award'
            },
            {
                name: 'Credit History Length',
                val: `${payload.cb_person_cred_hist_length} Yrs`,
                status: payload.cb_person_cred_hist_length >= 3 ? 'positive' : 'negative',
                icon: 'fa-clock-rotate-left'
            },
            {
                name: 'Prior Default Record',
                val: payload.cb_person_default_on_file === 'Y' ? 'Default Exists (Y)' : 'No Default (N)',
                status: payload.cb_person_default_on_file === 'N' ? 'positive' : 'negative',
                icon: 'fa-shield-halved'
            }
        ];

        factors.forEach(f => {
            const item = document.createElement('div');
            item.className = `factor-item factor-${f.status}`;
            item.innerHTML = `
                <span class="factor-name">
                    <i class="fa-solid ${f.icon} ${f.status === 'positive' ? 'text-green' : 'text-red'}"></i>
                    ${f.name}
                </span>
                <span class="factor-val">${f.val}</span>
            `;
            factorsList.appendChild(item);
        });
    }

    // Developer Copy Code Buttons
    btnCopyReq.addEventListener('click', () => {
        navigator.clipboard.writeText(jsonRequest.textContent);
        btnCopyReq.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => btnCopyReq.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
    });

    btnCopyRes.addEventListener('click', () => {
        navigator.clipboard.writeText(jsonResponse.textContent);
        btnCopyRes.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => btnCopyRes.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
    });

    // Toast Error Functions
    function showErrorNotification(url) {
        errorServerUrl.textContent = url;
        errorNotification.classList.remove('hidden');
    }

    function hideErrorNotification() {
        errorNotification.classList.add('hidden');
    }

    btnErrorRetry.addEventListener('click', async () => {
        hideErrorNotification();
        const isConnected = await checkBackendHealth();
        if (!isConnected) {
            showErrorNotification(API_BASE_URL);
        }
    });

    // --- Parallax Movement Effect on Background Orbs ---
    window.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX / window.innerWidth - 0.5) * 30;
        const moveY = (e.clientY / window.innerHeight - 0.5) * 30;
        
        const g1 = document.getElementById('globe1');
        const g2 = document.getElementById('globe2');
        const g3 = document.getElementById('globe3');

        if (g1) g1.style.transform = `translate(${moveX * 0.8}px, ${moveY * 0.8}px)`;
        if (g2) g2.style.transform = `translate(${-moveX * 0.6}px, ${-moveY * 0.6}px)`;
        if (g3) g3.style.transform = `translate(${moveX * 0.4}px, ${-moveY * 0.4}px)`;
    });
});
