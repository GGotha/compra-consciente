import { SelicCalculation } from "../types";

// Simplified Selic annual rate (adjust as needed)
const CURRENT_SELIC_RATE = 10.5; // 10.5% annual rate

/**
 * Calculate the potential returns if the money was invested in Selic
 * instead of being spent
 *
 * @param amount The amount in BRL that would be invested
 * @returns Returns over different time periods
 */
export function calculateSelicReturns(amount: number): SelicCalculation {
  // Monthly rate (simplified)
  const monthlyRate = CURRENT_SELIC_RATE / 12 / 100;

  // Calculate returns for different time periods
  const oneMonth = amount * (1 + monthlyRate);
  const sixMonths = amount * Math.pow(1 + monthlyRate, 6);
  const oneYear = amount * (1 + CURRENT_SELIC_RATE / 100);

  return {
    amount,
    oneMonth: oneMonth - amount,
    sixMonths: sixMonths - amount,
    oneYear: oneYear - amount,
  };
}
