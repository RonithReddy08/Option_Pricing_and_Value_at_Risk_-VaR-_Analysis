import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm
import yfinance as yf
import datetime as dt

# Page configuration
st.set_page_config(
    page_title="Option Pricing & VaR Analysis",
    page_icon="📈",
    layout="wide"
)

# Custom CSS for dark theme
st.markdown("""
    <style>
    .stApp {
        background-color: #0f172a;
    }
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 30px;
        color: white;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #475569;
        margin: 10px 0;
    }
    .stSelectbox, .stNumberInput, .stTextInput {
        color: #e2e8f0;
    }
    div[data-testid="stHorizontalBlock"] {
        gap: 1rem;
    }
    section[data-testid="stSidebar"] {
        display: none;
    }
    </style>
    """, unsafe_allow_html=True)

# Header
st.markdown("""
    <div class="main-header">
        <h1>📈 Option Pricing and Value at Risk (VaR) Analysis</h1>
        <p>Interactive financial modeling tool combining Black–Scholes option pricing with Value at Risk (VaR) analysis to measure portfolio risk under market uncertainty.</p>
    </div>
    """, unsafe_allow_html=True)

# Black-Scholes Functions
def norm_cdf(x):
    return norm.cdf(x)

def calculate_black_scholes(S, K, T, r, vol):
    d1 = (np.log(S / K) + (r + 0.5 * vol ** 2) * T) / (vol * np.sqrt(T))
    d2 = d1 - vol * np.sqrt(T)
    
    call_price = S * norm_cdf(d1) - K * np.exp(-r * T) * norm_cdf(d2)
    put_price = K * np.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)
    
    return d1, d2, call_price, put_price

# Create tabs
tab1, tab2 = st.tabs(["📊 Black-Scholes Pricing", "⚠️ Value at Risk (VaR)"])

# TAB 1: Black-Scholes
with tab1:
    st.markdown("## 🧮 Black-Scholes Option Pricing Model")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        S = st.number_input("Stock Price (S)", value=45.0, step=1.0)
    with col2:
        K = st.number_input("Strike Price (K)", value=40.0, step=1.0)
    with col3:
        T = st.number_input("Time to Expiration (years)", value=0.5, step=0.1)
    with col4:
        r = st.number_input("Risk-free Rate (r)", value=0.1, step=0.01, format="%.3f")
    with col5:
        vol = st.number_input("Volatility (σ)", value=0.2, step=0.01, format="%.3f")
    
    # Calculate
    d1, d2, call_price, put_price = calculate_black_scholes(S, K, T, r, vol)
    
    # Display results
    st.markdown("### Results")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div style='background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); 
                    padding: 20px; border-radius: 8px; text-align: center;'>
            <p style='color: #cffafe; margin: 0; font-size: 14px;'>Call Option Price</p>
            <h2 style='color: white; margin: 10px 0;'>${call_price:.2f}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div style='background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); 
                    padding: 20px; border-radius: 8px; text-align: center;'>
            <p style='color: #fecdd3; margin: 0; font-size: 14px;'>Put Option Price</p>
            <h2 style='color: white; margin: 10px 0;'>${put_price:.2f}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div style='background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
                    padding: 20px; border-radius: 8px; text-align: center;'>
            <p style='color: #dcfce7; margin: 0; font-size: 14px;'>d1 Value</p>
            <h2 style='color: white; margin: 10px 0;'>{d1:.4f}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div style='background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); 
                    padding: 20px; border-radius: 8px; text-align: center;'>
            <p style='color: #fef9c3; margin: 0; font-size: 14px;'>d2 Value</p>
            <h2 style='color: white; margin: 10px 0;'>{d2:.4f}</h2>
        </div>
        """, unsafe_allow_html=True)

# TAB 2: VaR
with tab2:
    st.markdown("## 📉 Value at Risk (VaR) Analysis")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        portfolio_value = st.number_input("Portfolio Value ($)", value=1000000, step=10000)
    with col2:
        days = st.number_input("Time Horizon (days)", value=20, step=1)
    with col3:
        confidence = st.selectbox("Confidence Level", [0.90, 0.95, 0.99], index=1, format_func=lambda x: f"{x*100:.0f}%")
    with col4:
        simulations = st.number_input("Simulations", value=10000, step=1000)
    
    # Custom tickers section
    st.markdown("### 📊 Portfolio Composition")
    use_custom_tickers = st.checkbox("Use Custom Stock Tickers")
    
    if use_custom_tickers:
        tickers_input = st.text_input(
            "Stock Tickers (comma-separated)",
            value="SPY,BND,GLD,QQQ,VTI",
            help="Enter stock tickers separated by commas"
        )
        ticker_list = [t.strip() for t in tickers_input.split(',') if t.strip()]
        st.info(f"Portfolio contains {len(ticker_list)} tickers: {', '.join(ticker_list)}")
    else:
        ticker_list = ['SPY', 'BND', 'GLD', 'QQQ', 'VTI']
    
    # Calculate button
    if st.button("🔄 Calculate VaR", type="primary"):
        with st.spinner("Running Monte Carlo simulation..."):
            # Monte Carlo simulation
            portfolio_return = 0.0003  # Daily expected return
            portfolio_std_dev = 0.008  # Daily volatility
            
            returns = []
            for _ in range(simulations):
                # Box-Muller transform
                u1 = np.random.random()
                u2 = np.random.random()
                z = np.sqrt(-2 * np.log(u1)) * np.cos(2 * np.pi * u2)
                
                scenario_return = (portfolio_value * portfolio_return * days + 
                                 portfolio_value * portfolio_std_dev * z * np.sqrt(days))
                returns.append(scenario_return)
            
            returns = np.array(returns)
            returns.sort()
            
            var_index = int((1 - confidence) * simulations)
            var_value = -returns[var_index]
            mean_return = returns.mean()
            std_dev = returns.std()
            
            # Display metrics
            st.markdown("### 📈 Risk Metrics")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                            padding: 20px; border-radius: 8px; text-align: center;'>
                    <p style='color: #fecdd3; margin: 0; font-size: 14px;'>Value at Risk (VaR)</p>
                    <h2 style='color: white; margin: 10px 0;'>${var_value:,.2f}</h2>
                    <p style='color: #fecdd3; margin: 0; font-size: 12px;'>at {confidence*100:.0f}% confidence</p>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                            padding: 20px; border-radius: 8px; text-align: center;'>
                    <p style='color: #dbeafe; margin: 0; font-size: 14px;'>Expected Return</p>
                    <h2 style='color: white; margin: 10px 0;'>${mean_return:,.2f}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            with col3:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
                            padding: 20px; border-radius: 8px; text-align: center;'>
                    <p style='color: #e0e7ff; margin: 0; font-size: 14px;'>Standard Deviation</p>
                    <h2 style='color: white; margin: 10px 0;'>${std_dev:,.2f}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            # Display tickers
            if ticker_list:
                st.markdown("### 📋 Portfolio Holdings")
                ticker_cols = st.columns(len(ticker_list))
                for idx, ticker in enumerate(ticker_list):
                    with ticker_cols[idx]:
                        st.markdown(f"""
                        <div style='background: #667eea; color: white; padding: 8px; 
                                    border-radius: 6px; text-align: center; font-weight: 600;'>
                            {ticker}
                        </div>
                        """, unsafe_allow_html=True)
            
            # Plot histogram
            st.markdown("### 📊 Distribution of Scenario Returns")
            fig, ax = plt.subplots(figsize=(12, 6))
            fig.patch.set_facecolor('#0f172a')
            ax.set_facecolor('#1e293b')
            
            ax.hist(returns, bins=50, color='#667eea', alpha=0.7, edgecolor='white')
            ax.axvline(-var_value, color='#dc2626', linestyle='--', linewidth=2, 
                      label=f'VaR at {confidence*100:.0f}% confidence')
            ax.set_xlabel('Scenario Gain/Loss ($)', color='#cbd5e1', fontsize=12)
            ax.set_ylabel('Frequency', color='#cbd5e1', fontsize=12)
            ax.tick_params(colors='#cbd5e1')
            ax.legend(facecolor='#1e293b', edgecolor='#475569', labelcolor='#cbd5e1')
            ax.grid(True, alpha=0.2, color='#475569')
            
            for spine in ax.spines.values():
                spine.set_color('#475569')
            
            st.pyplot(fig)