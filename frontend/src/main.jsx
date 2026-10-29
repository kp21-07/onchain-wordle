import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => console.error("Aptos Wallet Adapter Error:", error)}
    >
      <App />
    </AptosWalletAdapterProvider>
  </React.StrictMode>,
);
