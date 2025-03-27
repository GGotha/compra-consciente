export interface SelicCalculation {
  amount: number;
  oneMonth: number;
  sixMonths: number;
  oneYear: number;
}

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  selicCalculation: SelicCalculation | null;
}
