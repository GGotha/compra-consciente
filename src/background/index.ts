import { CartState } from "../types";
import {
  ChromeMessage,
  ChromeMessageSender,
  ChromeMessageResponse,
} from "../types/chrome";

// Current cart state stored in the background
let currentCartState: CartState | null = null;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("Selic Saver extension installed");

  // Initialize empty cart state
  currentCartState = {
    items: [],
    total: 0,
    selicCalculation: null,
  };
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener(
  (
    message: ChromeMessage,
    _sender: ChromeMessageSender,
    sendResponse: ChromeMessageResponse
  ) => {
    console.log("Background received message:", message.type);

    switch (message.type) {
      case "CART_UPDATE":
        // Update cart state when content script detects changes
        if (message.payload) {
          currentCartState = message.payload;

          // Notify popup if it's open
          chrome.runtime.sendMessage({
            type: "UPDATE_UI",
            payload: currentCartState,
          });
        }
        break;

      case "GET_CART_STATE":
        // Return current cart state to popup
        sendResponse({ cartState: currentCartState });
        break;
    }

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
);
