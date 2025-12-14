import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function BisectionVisualizer() {
  const [func, setFunc] = useState('x^3 - x - 2');
  const [a, setA] = useState('1');
  const [b, setB] = useState('2');
  const [tolerance, setTolerance] = useState('0.001');
  const [results, setResults] = useState(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [error, setError] = useState('');

  const evaluateFunction = (funcStr, x) => {
    try {
      let expr = funcStr
        .replace(/\^/g, '**')
        .replace(/(\d)([a-z])/gi, '$1*$2')
        .replace(/\)(\d)/g, ')*$1')
        .replace(/(\d)\(/g, '$1*(');
      
      expr = expr.replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log')
        .replace(/exp/g, 'Math.exp');
      
      const result = eval(expr.replace(/x/g, `(${x})`));
      return result;
    } catch (e) {
      throw new Error('Invalid function');
    }
  };

  const runBisection = () => {
    setError('');
    try {
      const aVal = parseFloat(a);
      const bVal = parseFloat(b);
      const tol = parseFloat(tolerance);

      if (isNaN(aVal) || isNaN(bVal) || isNaN(tol)) {
        setError('Please enter valid numbers');
        return;
      }

      if (aVal >= bVal) {
        setError('a must be less than b');
        return;
      }

      const iterations = [];
      let aTemp = aVal;
      let bTemp = bVal;
      let iter = 0;
      const maxIter = 100;

      const fa = evaluateFunction(func, aTemp);
      const fb = evaluateFunction(func, bTemp);

      if (fa * fb > 0) {
        setError('f(a) and f(b) must have opposite signs');
        return;
      }

      while (iter < maxIter) {
        const c = (aTemp + bTemp) / 2;
        const faVal = evaluateFunction(func, aTemp);
        const fbVal = evaluateFunction(func, bTemp);
        const fcVal = evaluateFunction(func, c);
        const diff = bTemp - aTemp;
        const meetsToler = diff < tol;

        iterations.push({
          iteration: iter + 1,
          a: aTemp,
          b: bTemp,
          c: c,
          fa: faVal,
          fb: fbVal,
          fc: fcVal,
          diff: diff,
          meetsTolerance: meetsToler
        });

        if (meetsToler || Math.abs(fcVal) < 1e-10) {
          break;
        }

        if (faVal * fcVal < 0) {
          bTemp = c;
        } else {
          aTemp = c;
        }

        iter++;
      }

      setResults(iterations);
      setCurrentIteration(0);
    } catch (e) {
      setError(e.message);
    }
  };

  const generateGraphData = () => {
    if (!results) return [];
    
    const iter = results[currentIteration];
    const minX = Math.min(parseFloat(a), iter.a) - 1;
    const maxX = Math.max(parseFloat(b), iter.b) + 1;
    const points = [];
    
    for (let x = minX; x <= maxX; x += (maxX - minX) / 200) {
      try {
        const y = evaluateFunction(func, x);
        if (isFinite(y) && Math.abs(y) < 1000) {
          points.push({ x, y });
        }
      } catch (e) {}
    }
    
    return points;
  };

  const getMarkerPoints = () => {
    if (!results) return [];
    const iter = results[currentIteration];
    const points = [
      { x: iter.a, y: 0, label: 'a', color: '#ef4444' },
      { x: iter.b, y: 0, label: 'b', color: '#3b82f6' }
    ];
    
    if (currentIteration === results.length - 1) {
      points.push({ x: iter.c, y: 0, label: 'c (root)', color: '#ABE7B2' });
    }
    
    return points;
  };

  const reset = () => {
    setResults(null);
    setCurrentIteration(0);
    setError('');
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-2" style={{ fontFamily: "'Pixelify Sans', cursive", color: '#2d5016' }}>
              HalfWay
            </h1>
            <p className="text-lg" style={{ color: '#4a7c2c' }}>Visualize the iterative process of finding function roots</p>
          </div>
          <a 
            href="about.html" 
            className="px-6 py-2 font-medium transition"
            style={{ backgroundColor: '#ABE7B2', color: '#2d5016', border: '2px solid black' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#9dd9a3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ABE7B2'}
          >
            About
          </a>
        </div>

        {/* Input Section */}
        <div className="shadow-lg p-4 sm:p-6 mb-8" style={{ backgroundColor: '#ECF4E8', border: '2px solid black' }}>
          <h2 className="text-2xl font-semibold mb-4">Input Parameters</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Function f(x)</label>
              <input
                type="text"
                value={func}
                onChange={(e) => setFunc(e.target.value)}
                className="w-full px-4 py-2 focus:ring-2 focus:outline-none"
                style={{ border: '2px solid black', backgroundColor: 'white' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(171, 231, 178, 0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                placeholder="e.g., x^3 - x - 2"
              />
              <p className="text-xs text-gray-500 mt-1">Use ^ for power, e.g., x^2 or x^3</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-2">a (left)</label>
                <input
                  type="text"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                  className="w-full px-4 py-2 focus:ring-2 focus:outline-none"
                  style={{ border: '2px solid black', backgroundColor: 'white' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(171, 231, 178, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">b (right)</label>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ABE7B2] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tolerance</label>
                <input
                  type="text"
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ABE7B2] focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={runBisection}
              className="flex items-center gap-2 px-6 py-2 font-medium transition"
              style={{ backgroundColor: '#ABE7B2', color: '#2d5016', border: '2px solid black' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#9dd9a3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ABE7B2'}
            >
              <Play size={20} />
              Calculate Root
            </button>
            {results && (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-2 transition"
                style={{ backgroundColor: '#6b8e5f', color: 'white', border: '2px solid black' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a7850'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b8e5f'}
              >
                <RotateCcw size={20} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary Section */}
        {results && (
          <>
            <div className="shadow-lg p-4 sm:p-6 mb-8" style={{ backgroundColor: 'white', border: '2px solid black' }}>
              <h2 className="text-2xl font-semibold mb-4">Summary</h2>
              <div className="p-4" style={{ backgroundColor: '#ECF4E8', border: '2px solid black' }}>
                <p className="leading-relaxed" style={{ color: '#2d5016' }}>
                  Find the root of the function <span className="font-mono font-semibold">f(x) = {func}</span> given 
                  the interval <span className="font-semibold">[{a}, {b}]</span> and 
                  tolerance <span className="font-semibold">{tolerance}</span>.
                </p>
                <p className="leading-relaxed mt-3" style={{ color: '#2d5016' }}>
                  Using the bisection method, the formula is: <span className="font-mono font-semibold">c = (a + b) / 2</span>
                </p>
                <p className="mt-3" style={{ color: '#3d6626' }}>
                  The algorithm repeatedly bisects the interval and selects the subinterval where the function changes sign, 
                  thus converging to a root.
                </p>
                <p className="font-semibold mt-4" style={{ color: '#2d5016' }}>
                  Root found: <span style={{ color: '#4a7c2c' }}>{results[results.length - 1].c.toFixed(6)}</span> after {results.length} iterations
                </p>
              </div>
            </div>

            {/* Visualization Section */}
            <div className="shadow-lg p-4 sm:p-6 mb-8" style={{ backgroundColor: 'white', border: '2px solid black' }}>
              <h2 className="text-2xl font-semibold mb-4">Interactive Visualization</h2>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Graph */}
                <div className="xl:col-span-3">
                  <div className="p-2 sm:p-4" style={{ border: '2px solid black', backgroundColor: 'white' }}>
                    <ResponsiveContainer width="100%" height={500}>
                      <LineChart data={generateGraphData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" type="number" domain={['auto', 'auto']} />
                        <YAxis type="number" domain={['auto', 'auto']} />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                        <Line type="monotone" dataKey="y" stroke="#4a5568" dot={false} strokeWidth={3} />
                        {getMarkerPoints().map((point, idx) => (
                          <ReferenceLine
                            key={idx}
                            x={point.x}
                            stroke={point.color}
                            strokeWidth={3}
                            label={{ value: point.label, position: 'top', fill: point.color, fontWeight: 'bold' }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Controls */}
                <div className="xl:col-span-1">
                  <div className="p-4 h-full" style={{ backgroundColor: '#ECF4E8', border: '2px solid black' }}>
                    <h3 className="font-semibold mb-3 text-lg" style={{ color: '#2d5016' }}>Iteration Control</h3>
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold" style={{ color: '#2d5016' }}>
                        {currentIteration + 1} / {results.length}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => setCurrentIteration(Math.max(0, currentIteration - 1))}
                        disabled={currentIteration === 0}
                        className="flex-1 flex items-center justify-center gap-1 px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'white', color: '#2d5016', border: '2px solid black' }}
                        onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f7f7f7')}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <ChevronLeft size={20} />
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentIteration(Math.min(results.length - 1, currentIteration + 1))}
                        disabled={currentIteration === results.length - 1}
                        className="flex-1 flex items-center justify-center gap-1 px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'white', color: '#2d5016', border: '2px solid black' }}
                        onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f7f7f7')}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        Next
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                        <span className="text-red-600 font-semibold">a:</span>
                        <span className="font-mono font-medium" style={{ color: '#2d5016' }}>{results[currentIteration].a.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                        <span className="text-blue-600 font-semibold">b:</span>
                        <span className="font-mono font-medium" style={{ color: '#2d5016' }}>{results[currentIteration].b.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                        <span className="font-semibold" style={{ color: '#4a7c2c' }}>c:</span>
                        <span className="font-mono font-medium" style={{ color: '#2d5016' }}>{results[currentIteration].c.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                        <span className="font-semibold" style={{ color: '#2d5016' }}>f(c):</span>
                        <span className="font-mono font-medium" style={{ color: '#2d5016' }}>{results[currentIteration].fc.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                        <span className="font-semibold" style={{ color: '#2d5016' }}>b - a:</span>
                        <span className="font-mono font-medium" style={{ color: '#2d5016' }}>{results[currentIteration].diff.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="shadow-lg p-4 sm:p-6" style={{ backgroundColor: 'white', border: '2px solid black' }}>
              <h2 className="text-2xl font-semibold mb-4">Iteration Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm" style={{ border: '2px solid black' }}>
                  <thead style={{ backgroundColor: '#ABE7B2' }}>
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>Iteration</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>a</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>b</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>c</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>f(a)</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>f(b)</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>f(c)</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>b - a</th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold" style={{ color: '#2d5016' }}>Tolerance Met</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50"
                        style={idx === currentIteration ? { backgroundColor: '#ECF4E8', fontWeight: '600', borderTop: '2px solid black', borderBottom: '2px solid black' } : { borderBottom: '1px solid black' }}
                      >
                        <td className="px-2 sm:px-4 py-2">{row.iteration}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.a.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.b.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.c.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.fa.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.fb.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.fc.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2 font-mono text-xs">{row.diff.toFixed(6)}</td>
                        <td className="px-2 sm:px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            row.meetsTolerance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {row.meetsTolerance ? 'TRUE' : 'FALSE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}