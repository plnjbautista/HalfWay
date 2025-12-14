// --- Global State ---
let results = [];
let currentIteration = 0;
let chartInstance = null;
let funcStr = 'x^3 - x - 2';
let aVal = 1;
let bVal = 2;
let toleranceVal = 0.001;

// --- DOM References ---
const funcInput = document.getElementById('func-input');
const aInput = document.getElementById('a-input');
const bInput = document.getElementById('b-input');
const toleranceInput = document.getElementById('tolerance-input');
const calculateButton = document.getElementById('calculate-button');
const resetButton = document.getElementById('reset-button');
const resetViewButton = document.getElementById('reset-view-button');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');
const summaryContent = document.getElementById('summary-content');
const iterationDisplay = document.getElementById('iteration-display');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const iterationDetails = document.getElementById('iteration-details');
const tableBody = document.createElement('tbody');

// --- Utility Functions ---
const evaluateFunction = (funcStr, x) => {
    try {
        let expr = funcStr
            .replace(/\^/g, '**')
            .replace(/(\d)([a-z])/gi, '$1*$2')
            .replace(/\)(\d)/g, ')*$1')
            .replace(/(\d)\(/g, '$1*(')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log')
            .replace(/exp/g, 'Math.exp');
        const result = new Function('x', `return ${expr.replace(/x/g, `(${x})`)}`)(x);
        if (isNaN(result) || !isFinite(result)) throw new Error('NaN or Infinity');
        return result;
    } catch (e) {
        throw new Error('Invalid function or math error: ' + e.message);
    }
};

const displayError = (msg) => { errorMessage.textContent = msg; errorMessage.classList.remove('hidden'); };
const clearError = () => { errorMessage.classList.add('hidden'); errorMessage.textContent = ''; };
const toFixedSafe = (num, precision = 6) => (Math.abs(num) < 1e-10 ? (0).toFixed(precision) : num.toFixed(precision));

// --- Core Bisection ---
const runBisection = () => {
    clearError();
    results = [];
    try {
        funcStr = funcInput.value.trim();
        aVal = parseFloat(aInput.value);
        bVal = parseFloat(bInput.value);
        toleranceVal = parseFloat(toleranceInput.value);
        if (isNaN(aVal) || isNaN(bVal) || isNaN(toleranceVal)) throw new Error('Enter valid values.');
        if (aVal >= bVal) throw new Error('Lower bound a must be less than b.');

        let aTemp = aVal, bTemp = bVal, iter = 0, maxIter = 100;
        const fa_init = evaluateFunction(funcStr, aTemp);
        const fb_init = evaluateFunction(funcStr, bTemp);
        if (fa_init * fb_init > 0) throw new Error(`f(a) and f(b) must have opposite signs.`);

        while (iter < maxIter) {
            const c = (aTemp + bTemp) / 2;
            const faVal = evaluateFunction(funcStr, aTemp);
            const fbVal = evaluateFunction(funcStr, bTemp);
            const fcVal = evaluateFunction(funcStr, c);
            const diff = bTemp - aTemp;
            const meetsToler = diff < toleranceVal;

            results.push({ iteration: iter + 1, a: aTemp, b: bTemp, c, fa: faVal, fb: fbVal, fc: fcVal, diff, meetsTolerance: meetsToler });
            if (meetsToler || Math.abs(fcVal) < 1e-10) break;
            if (faVal * fcVal < 0) bTemp = c; else aTemp = c;
            iter++;
        }

        currentIteration = results.length - 1;
        updateUI();
    } catch (e) { displayError(e.message); reset(); }
};

const reset = () => { 
    results = []; 
    currentIteration = 0; 
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; } 
    resultsContainer.classList.add('hidden'); 
    resetButton.classList.add('hidden'); 
};

// --- UI Functions ---
const updateUI = () => {
    if (!results.length) { resultsContainer.classList.add('hidden'); resetButton.classList.add('hidden'); return; }
    resultsContainer.classList.remove('hidden');
    resetButton.classList.remove('hidden');
    currentIteration = Math.max(0, Math.min(results.length - 1, currentIteration));
    updateSummary(); updateControls(); updateChart(); updateTable();
};

const updateSummary = () => {
    const finalResult = results[results.length - 1];
    summaryContent.innerHTML = `
        <p style="color:#000000;">Find the root of f(x) = ${funcStr} in the interval [${aVal}, ${bVal}] with tolerance ${toleranceVal}.</p>
        <p style="color:#000000;">Root found: ${toFixedSafe(finalResult.c,6)} after ${results.length} iterations</p>
    `;
};

const updateControls = () => {
    const iterData = results[currentIteration];
    iterationDisplay.textContent = `${currentIteration + 1} / ${results.length}`;
    prevButton.disabled = currentIteration === 0;
    nextButton.disabled = currentIteration === results.length - 1;

    iterationDetails.innerHTML = `
        <div class="control-detail-row"><span class="control-detail-label">a:</span><span class="control-detail-value">${toFixedSafe(iterData.a,6)}</span></div>
        <div class="control-detail-row"><span class="control-detail-label">b:</span><span class="control-detail-value">${toFixedSafe(iterData.b,6)}</span></div>
        <div class="control-detail-row"><span class="control-detail-label">c:</span><span class="control-detail-value">${toFixedSafe(iterData.c,6)}</span></div>
        <div class="control-detail-row"><span class="control-detail-label">f(c):</span><span class="control-detail-value">${toFixedSafe(iterData.fc,6)}</span></div>
        <div class="control-detail-row"><span class="control-detail-label">b-a:</span><span class="control-detail-value">${toFixedSafe(iterData.diff,6)}</span></div>
    `;
};


const generateGraphData = () => {
    if (!results.length) return [];
    const iter = results[currentIteration];
    const minX = Math.min(aVal, iter.a) - 0.5, maxX = Math.max(bVal, iter.b) + 0.5;
    const points = [];
    for (let i=0;i<=200;i++){
        const x = minX + (maxX-minX)*(i/200);
        try { const y=evaluateFunction(funcStr,x); if(isFinite(y)&&Math.abs(y)<100) points.push({x,y}); } catch(e){}
    }
    return points;
};

// --- Chart Rendering ---
const updateChart = () => {
    const graphData = generateGraphData();
    const ctx = document.getElementById('bisection-chart').getContext('2d');
    const yValues = graphData.map(p=>p.y);
    const minY = Math.min(...yValues,0)*1.1, maxY = Math.max(...yValues,0)*1.1;

    if(chartInstance) chartInstance.destroy();

    const aPoints = results.slice(0,currentIteration+1).map((r,i)=>({x:r.a,y:r.fa,label:`a${i}=${toFixedSafe(r.a,6)}`}));
    const bPoints = results.slice(0,currentIteration+1).map((r,i)=>({x:r.b,y:r.fb,label:`b${i}=${toFixedSafe(r.b,6)}`}));
    const cPoints = results.slice(0,currentIteration+1).map((r,i)=>({x:r.c,y:r.fc,label:`c${i}=${toFixedSafe(r.c,6)}`, backgroundColor:'#4a7c2c'}));
    if(currentIteration===results.length-1) cPoints[cPoints.length-1].backgroundColor='#000000';

    chartInstance = new Chart(ctx,{
        type:'line',
        data:{datasets:[
            {label:`f(x)=${funcStr}`,data:graphData,borderColor:'#4a5568',borderWidth:3,fill:false,tension:0.1,pointRadius:0},
            {label:'a',data:aPoints,backgroundColor:'#dc2626AA',borderColor:'#dc2626AA',pointRadius:4,type:'scatter'},
            {label:'b',data:bPoints,backgroundColor:'#2563ebAA',borderColor:'#2563ebAA',pointRadius:4,type:'scatter'},
            {label:'c',data:cPoints,backgroundColor:'#4a7c2cAA',borderColor:'#4a7c2cAA',pointRadius:4,type:'scatter'}
        ]},
        options:{
            responsive:true, maintainAspectRatio:false,
            scales:{ x:{type:'linear',position:'bottom',title:{display:true,text:'x'}}, y:{min:minY,max:maxY,title:{display:true,text:'f(x)'}} },
            plugins:{
                legend:{display:true},
                tooltip:{callbacks:{ title:()=>'', label:item=>item.raw.label || `x:${toFixedSafe(item.parsed.x)},y:${toFixedSafe(item.parsed.y)}`} },
                zoom:{
                    pan:{enabled:false},
                    zoom:{wheel:{enabled:false},pinch:{enabled:false},mode:'xy',drag:{enabled:true}}
                }
            }
        },
        plugins:[ChartZoom]
    });
};

// --- Reset Zoom ---
resetViewButton.addEventListener('click',()=>{ if(chartInstance) chartInstance.resetZoom(); });

// --- Table ---
const updateTable = () => { 
    tableBody.innerHTML = '';
    const tableEl = document.getElementById('iteration-table');
    if(!tableEl.querySelector('thead')){
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Iteration</th><th>a</th><th>b</th><th>c</th><th>f(a)</th><th>f(b)</th><th>f(c)</th><th>b-a</th><th>Tolerance Met</th>
            </tr>`;
        tableEl.appendChild(thead);
        tableEl.appendChild(tableBody);
    }
    results.forEach((row, idx) => {
    const tr = document.createElement('tr');

    // Highlight row if TRUE
    if (row.meetsTolerance) tr.classList.add('true-row');
    if (idx === currentIteration) tr.classList.add('highlighted-row');

    tr.onclick = () => { currentIteration = idx; updateUI(); };

    tr.innerHTML = `
        <td>${row.iteration}</td>
        <td>${toFixedSafe(row.a,6)}</td>
        <td>${toFixedSafe(row.b,6)}</td>
        <td>${toFixedSafe(row.c,6)}</td>
        <td>${toFixedSafe(row.fa,6)}</td>
        <td>${toFixedSafe(row.fb,6)}</td>
        <td>${toFixedSafe(row.fc,6)}</td>
        <td>${toFixedSafe(row.diff,6)}</td>
        <td><span class="${row.meetsTolerance ? 'badge-true' : 'badge-false'}">${row.meetsTolerance ? 'TRUE' : 'FALSE'}</span></td>
    `;
    tableBody.appendChild(tr);
});

};

// --- Events ---
document.addEventListener('DOMContentLoaded', () => {
    // Removed setting default values; placeholders will guide the user
    calculateButton.addEventListener('click', runBisection);
    resetButton.addEventListener('click', reset);
    prevButton.addEventListener('click', () => { currentIteration--; updateUI(); });
    nextButton.addEventListener('click', () => { currentIteration++; updateUI(); });
});

const downloadCSVButton = document.getElementById('download-csv-button');

const downloadCSV = () => {
    if (!results.length) return;

    // CSV header
    const headers = ["Iteration", "a", "b", "c", "f(a)", "f(b)", "f(c)", "b-a", "Tolerance Met"];
    const rows = results.map(r => [
        r.iteration,
        r.a.toFixed(6),
        r.b.toFixed(6),
        r.c.toFixed(6),
        r.fa.toFixed(6),
        r.fb.toFixed(6),
        r.fc.toFixed(6),
        r.diff.toFixed(6),
        r.meetsTolerance ? "TRUE" : "FALSE"
    ]);

    // Join header and rows
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bisection_iterations.csv';
    a.click();
    URL.revokeObjectURL(url);
};

// Event listener
downloadCSVButton.addEventListener('click', downloadCSV);
