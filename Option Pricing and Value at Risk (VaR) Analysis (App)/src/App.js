import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calculator, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const OptionsPricingApp = () => {
  // Add global styles
  useEffect(() => {
    // Remove default body margins and set background
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#0f172a';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Change page title
    document.title = 'Options Pricing & Risk Management';
    
    return () => {
      // Cleanup
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Black-Scholes State
  const [bsParams, setBsParams] = useState({
    S: 45,
    K: 40,
    T: 0.5,
    r: 0.1,
    vol: 0.2
  });
  const [bsResults, setBsResults] = useState(null);

  // VaR State
  const [varParams, setVarParams] = useState({
    portfolioValue: 1000000,
    days: 20,
    confidence: 0.95,
    simulations: 10000,
    useCustomTickers: false,
    tickers: 'SPY,BND,GLD,QQQ,VTI'
  });
  const [varResults, setVarResults] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Helper functions for Black-Scholes
  const normCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  const calculateBlackScholes = () => {
    const { S, K, T, r, vol } = bsParams;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);
    
    const callPrice = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    const putPrice = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    
    setBsResults({
      d1: d1.toFixed(4),
      d2: d2.toFixed(4),
      callPrice: callPrice.toFixed(2),
      putPrice: putPrice.toFixed(2)
    });
  };

  // Calculate VaR
  const calculateVaR = () => {
    setCalculating(true);
    
    setTimeout(() => {
      const { portfolioValue, days, confidence, simulations, tickers } = varParams;
      
      // Parse tickers
      const tickerList = tickers.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const numTickers = tickerList.length;
      
      // Simulate returns (simplified Monte Carlo)
      const returns = [];
      const portfolioReturn = 0.0003; // Daily expected return
      const portfolioStdDev = 0.008; // Daily volatility
      
      for (let i = 0; i < simulations; i++) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        const scenarioReturn = portfolioValue * portfolioReturn * days + 
                              portfolioValue * portfolioStdDev * z * Math.sqrt(days);
        returns.push(scenarioReturn);
      }
      
      returns.sort((a, b) => a - b);
      const varIndex = Math.floor((1 - confidence) * simulations);
      const varValue = -returns[varIndex];
      
      // Create histogram data
      const bins = 50;
      const min = Math.min(...returns);
      const max = Math.max(...returns);
      const binWidth = (max - min) / bins;
      
      const histogram = Array(bins).fill(0).map((_, i) => ({
        range: (min + i * binWidth).toFixed(0),
        count: 0
      }));
      
      returns.forEach(ret => {
        const binIndex = Math.min(Math.floor((ret - min) / binWidth), bins - 1);
        histogram[binIndex].count++;
      });
      
      setVarResults({
        var: varValue.toFixed(2),
        histogram: histogram,
        varThreshold: -varValue,
        mean: (returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(2),
        stdDev: Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - portfolioReturn * days * portfolioValue, 2), 0) / returns.length).toFixed(2),
        tickerList: tickerList
      });
      
      setCalculating(false);
    }, 500);
  };

  useEffect(() => {
    calculateBlackScholes();
  }, [bsParams]);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#0f172a', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 50px', borderRadius: '16px', marginBottom: '30px', color: 'white', boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <TrendingUp size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ margin: '0', fontSize: '36px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                Option Pricing and Value at Risk (VaR) Analysis
              </h1>
              <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '16px', fontWeight: '400' }}>
                - Interactive financial modeling tool combining Black–Scholes option pricing with Value at Risk (VaR) analysis to measure portfolio risk under market uncertainty.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Black-Scholes Section */}
      <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', marginTop: 0 }}>
          <Calculator size={24} />
          Black-Scholes Option Pricing
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Stock Price (S)
            </label>
            <input
              type="number"
              value={bsParams.S}
              onChange={(e) => setBsParams({...bsParams, S: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Strike Price (K)
            </label>
            <input
              type="number"
              value={bsParams.K}
              onChange={(e) => setBsParams({...bsParams, K: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Time to Expiration (years)
            </label>
            <input
              type="number"
              step="0.1"
              value={bsParams.T}
              onChange={(e) => setBsParams({...bsParams, T: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Risk-free Rate (r)
            </label>
            <input
              type="number"
              step="0.01"
              value={bsParams.r}
              onChange={(e) => setBsParams({...bsParams, r: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Volatility (σ)
            </label>
            <input
              type="number"
              step="0.01"
              value={bsParams.vol}
              onChange={(e) => setBsParams({...bsParams, vol: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
        </div>

        {bsResults && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #0891b2', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}>
              <div style={{ fontSize: '14px', color: '#cffafe', marginBottom: '5px' }}>Call Option Price</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>${bsResults.callPrice}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #be123c', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}>
              <div style={{ fontSize: '14px', color: '#fecdd3', marginBottom: '5px' }}>Put Option Price</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>${bsResults.putPrice}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #15803d', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>
              <div style={{ fontSize: '14px', color: '#dcfce7', marginBottom: '5px' }}>d1 Value</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>{bsResults.d1}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #a16207', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)' }}>
              <div style={{ fontSize: '14px', color: '#fef9c3', marginBottom: '5px' }}>d2 Value</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>{bsResults.d2}</div>
            </div>
          </div>
        )}
      </div>

      {/* VaR Section */}
      <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', marginTop: 0 }}>
          <AlertTriangle size={24} />
          Value at Risk (VaR) Analysis
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Portfolio Value ($)
            </label>
            <input
              type="number"
              value={varParams.portfolioValue}
              onChange={(e) => setVarParams({...varParams, portfolioValue: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Time Horizon (days)
            </label>
            <input
              type="number"
              value={varParams.days}
              onChange={(e) => setVarParams({...varParams, days: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Confidence Level (%)
            </label>
            <select
              value={varParams.confidence}
              onChange={(e) => setVarParams({...varParams, confidence: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            >
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
              Simulations
            </label>
            <input
              type="number"
              value={varParams.simulations}
              onChange={(e) => setVarParams({...varParams, simulations: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '10px', border: '2px solid #475569', borderRadius: '6px', fontSize: '16px', background: '#0f172a', color: '#e2e8f0' }}
            />
          </div>
        </div>

        {/* Custom Tickers Section */}
        <div style={{ marginBottom: '25px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              id="useCustomTickers"
              checked={varParams.useCustomTickers}
              onChange={(e) => setVarParams({...varParams, useCustomTickers: e.target.checked})}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="useCustomTickers" style={{ fontWeight: '600', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px' }}>
              Use Custom Stock Tickers
            </label>
          </div>
          
          {varParams.useCustomTickers && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>
                Stock Tickers (comma-separated)
              </label>
              <input
                type="text"
                value={varParams.tickers}
                onChange={(e) => setVarParams({...varParams, tickers: e.target.value})}
                placeholder="e.g., AAPL,MSFT,GOOGL,TSLA"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #475569', 
                  borderRadius: '6px', 
                  fontSize: '16px', 
                  background: '#1e293b', 
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
                Default: SPY, BND, GLD, QQQ, VTI (Equally weighted portfolio)
              </div>
            </div>
          )}
        </div>

        <button
          onClick={calculateVaR}
          disabled={calculating}
          style={{
            background: calculating ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: calculating ? 'not-allowed' : 'pointer',
            marginBottom: '25px',
            transition: 'all 0.3s'
          }}
        >
          {calculating ? 'Calculating...' : 'Calculate VaR'}
        </button>

        {varResults && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #991b1b', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)' }}>
                <div style={{ fontSize: '14px', color: '#fecdd3', marginBottom: '5px' }}>Value at Risk (VaR)</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>${parseFloat(varResults.var).toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#fecdd3', marginTop: '5px' }}>
                  at {(varParams.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
              
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #1d4ed8', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '14px', color: '#dbeafe', marginBottom: '5px' }}>Expected Return</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>${parseFloat(varResults.mean).toLocaleString()}</div>
              </div>
              
              <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '20px', borderRadius: '8px', border: '2px solid #4338ca', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
                <div style={{ fontSize: '14px', color: '#e0e7ff', marginBottom: '5px' }}>Standard Deviation</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>${parseFloat(varResults.stdDev).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0' }}>Distribution of Scenario Returns</h3>
                {varResults.tickerList && varResults.tickerList.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {varResults.tickerList.map((ticker, idx) => (
                      <span 
                        key={idx}
                        style={{ 
                          background: '#667eea', 
                          color: 'white', 
                          padding: '4px 10px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {ticker}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={varResults.histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="range" 
                    label={{ value: 'Scenario Gain/Loss ($)', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} 
                    stroke="#cbd5e1"
                  />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OptionsPricingApp;