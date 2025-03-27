/// <reference types="chrome"/>

import { CartState } from ".";

export interface ChromeMessage {
  type: "CART_UPDATE" | "UPDATE_UI" | "GET_CART_STATE";
  payload: CartState | null | undefined;
}

export interface ChromeMessageSender {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id?: string;
  url?: string;
}

export interface ChromeMessageResponse {
  (response?: { cartState?: CartState | null } | null): void;
}
