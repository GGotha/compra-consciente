import React, { useEffect, useState } from "react";
import { CartState } from "../types";

const Popup: React.FC = () => {
  const [cartState, setCartState] = useState<CartState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Request cart state from background
    chrome.runtime.sendMessage({ type: "GET_CART_STATE" }, (response) => {
      setCartState(response?.cartState || null);
      setLoading(false);
    });

    // Listen for updates from background script
    const messageListener = (message: { type: string; payload: CartState }) => {
      if (message.type === "UPDATE_UI" && message.payload) {
        setCartState(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!cartState || cartState.items.length === 0) {
    return (
      <div className="no-items">
        <h3>Nenhum item detectado</h3>
        <p>
          Navegue em um site de e-commerce para ver quanto você economizaria
          investindo na Selic.
        </p>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="header">
        <h1>Selic Saver</h1>
        <p className="subtitle">Economize investindo na Selic</p>
      </header>

      <div className="summary">
        <div className="total-section">
          <h2>Total de Compras</h2>
          <div className="total-value">{formatCurrency(cartState.total)}</div>
        </div>

        {cartState.selicCalculation && (
          <div className="selic-returns">
            <h2>Retorno na Selic</h2>
            <div className="return-item">
              <span>1 mês:</span>
              <span className="return-value">
                {formatCurrency(cartState.selicCalculation.oneMonth)}
              </span>
            </div>
            <div className="return-item">
              <span>6 meses:</span>
              <span className="return-value">
                {formatCurrency(cartState.selicCalculation.sixMonths)}
              </span>
            </div>
            <div className="return-item">
              <span>1 ano:</span>
              <span className="return-value">
                {formatCurrency(cartState.selicCalculation.oneYear)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="items-list">
        <h2>Itens Detectados</h2>
        {cartState.items.map((item, index) => (
          <div key={index} className="item">
            <div className="item-name">{item.name}</div>
            <div className="item-price">{formatCurrency(item.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Popup;
