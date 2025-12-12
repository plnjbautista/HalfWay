let chart = null;
let zoomLevel = 1;
let currentFuncStr = '';
let currentA = 0;
let currentB = 0;
let currentRoot = 0;
let currentIterations = [];

function evaluateFunction(funcStr, x) {
    try {
        const scope = { x: x };
        return math.evaluate(funcStr, scope);
    } catch (e) {
        throw new Error('Invalid function expression');
    }
}

function bisectionMethod(funcStr, a, b, tolerance) {
    const iterations = [];
    let fa = evaluateFunction(funcStr, a);
    let fb = evaluateFunction(funcStr, b);
    
    if (fa * fb > 0) {
        throw new Error('Function must have opposite signs at endpoints (f(a) and f(b) must have different signs)');
    }
    
    let iter = 0;
    const maxIter = 100;
    
    while (Math.abs(b - a) > tolerance && iter < maxIter) {
        const c = (a + b) / 2;
        const fc = evaluateFunction(funcStr, c);
        
        iterations.push({
            iteration: iter + 1,
            a: a,
            b: b,
            c: c,
            fc: fc,
            error: Math.abs(b - a)
        });
        
        if (Math.abs(fc) < tolerance) {
            break;
        }
        
        if (fa * fc < 0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }
        
        iter++;
    }
    
    return {
        root: (a + b) / 2,
        iterations: iterations
    };
}

function plotGraph(funcStr, a, b, root, iterations) {
    const ctx = document.getElementById('graphCanvas').getContext('2d');
    
    // Store current data for zoom functions
    currentFuncStr = funcStr;
    currentA = a;
    currentB = b;
    currentRoot = root;
    currentIterations = iterations;
    
    if (chart) {
        chart.destroy();
    }
    
    const range = Math.max(Math.abs(a), Math.abs(b)) * 1.5 / zoomLevel;
    const xMin = -range;
    const xMax = range;
    const step = (xMax - xMin) / 200;
    
    const functionData = [];
    for (let x = xMin; x <= xMax; x += step) {
        try {
            const y = evaluateFunction(funcStr, x);
            if (isFinite(y)) {
                functionData.push({ x: x, y: y });
            }
        } catch (e) {}
    }
    
    const iterationPoints = iterations.map(iter => ({
        x: iter.c,
        y: iter.fc
    }));
    
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'f(x)',
                    data: functionData,
                    type: 'line',
                    borderColor: '#000',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: 'Bisection Points',
                    data: iterationPoints,
                    backgroundColor: '#CBF3BB',
                    borderColor: '#000',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Root',
                    data: [{ x: root, y: 0 }],
                    backgroundColor: '#000',
                    borderColor: '#000',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointStyle: 'circle'
                },
                {
                    label: 'x-axis',
                    data: [{ x: xMin, y: 0 }, { x: xMax, y: 0 }],
                    type: 'line',
                    borderColor: '#666',
                    borderWidth: 1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Function Graph with Bisection Process',
                    font: { 
                        size: 18,
                        family: 'Roboto',
                        weight: '500'
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        font: {
                            family: 'Roboto'
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'x',
                        font: {
                            family: 'Roboto'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Roboto'
                        }
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'f(x)',
                        font: {
                            family: 'Roboto'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Roboto'
                        }
                    }
                }
            }
        }
    });
}

function displayResults(result, funcStr, a, b) {
    const resultsDiv = document.getElementById('resultsDiv');
    
    let html = `
        <div class="results">
            <div class="result-box">
                <h3>Root Found</h3>
                <p><strong>Approximate Root:</strong> x ≈ ${result.root.toFixed(6)}</p>
                <p><strong>f(${result.root.toFixed(6)}) ≈</strong> ${evaluateFunction(funcStr, result.root).toFixed(8)}</p>
                <p><strong>Iterations:</strong> ${result.iterations.length}</p>
            </div>
            
            <div class="iterations-table">
                <h3>Iteration Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Iteration</th>
                            <th>a</th>
                            <th>b</th>
                            <th>c (midpoint)</th>
                            <th>f(c)</th>
                            <th>Error (|b-a|)</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    result.iterations.forEach((iter, idx) => {
        const isLast = idx === result.iterations.length - 1;
        html += `
            <tr ${isLast ? 'class="highlight"' : ''}>
                <td>${iter.iteration}</td>
                <td>${iter.a.toFixed(6)}</td>
                <td>${iter.b.toFixed(6)}</td>
                <td>${iter.c.toFixed(6)}</td>
                <td>${iter.fc.toFixed(6)}</td>
                <td>${iter.error.toFixed(6)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function runBisection() {
    const errorDiv = document.getElementById('errorDiv');
    errorDiv.innerHTML = '';
    
    // Reset zoom when running new calculation
    zoomLevel = 1;
    
    try {
        const funcStr = document.getElementById('functionInput').value;
        const a = parseFloat(document.getElementById('leftInput').value);
        const b = parseFloat(document.getElementById('rightInput').value);
        const tolerance = parseFloat(document.getElementById('toleranceInput').value);
        
        if (!funcStr) {
            throw new Error('Please enter a function');
        }
        
        if (isNaN(a) || isNaN(b) || isNaN(tolerance)) {
            throw new Error('Please enter valid numbers for all inputs');
        }
        
        if (a >= b) {
            throw new Error('Left endpoint must be less than right endpoint');
        }
        
        if (tolerance <= 0) {
            throw new Error('Tolerance must be positive');
        }
        
        const result = bisectionMethod(funcStr, a, b, tolerance);
        plotGraph(funcStr, a, b, result.root, result.iterations);
        displayResults(result, funcStr, a, b);
        
    } catch (e) {
        errorDiv.innerHTML = `<div class="error"><strong>Error:</strong> ${e.message}</div>`;
    }
}

function zoomIn() {
    zoomLevel *= 1.5;
    if (currentFuncStr) {
        plotGraph(currentFuncStr, currentA, currentB, currentRoot, currentIterations);
    }
}

function zoomOut() {
    zoomLevel /= 1.5;
    if (currentFuncStr) {
        plotGraph(currentFuncStr, currentA, currentB, currentRoot, currentIterations);
    }
}

function resetZoom() {
    zoomLevel = 1;
    if (currentFuncStr) {
        plotGraph(currentFuncStr, currentA, currentB, currentRoot, currentIterations);
    }
}

// Run on load with default values
runBisection();