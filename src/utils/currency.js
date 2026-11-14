// Indian Rupee (INR / ₹) Currency Utility

/**
 * Formats a number as Indian Currency (e.g. ₹1,450.00 or ₹399)
 * @param {number|string} amount
 * @param {boolean} showDecimals
 * @returns {string}
 */
export const formatINR = (amount, showDecimals = true) => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount || 0);
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

export const CURRENCY_SYMBOL = '₹';

export default formatINR;

