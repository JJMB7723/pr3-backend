// utils/generateOrderNumber.js – Sequential & Clean Order Number Generator
// -------------------------------------------------------------------------
// Generates clean, sequential order numbers: PR3-ORD-1001, PR3-ORD-1002, etc.

const generateOrderNumber = (sequence = null) => {
  if (sequence) {
    return `PR3-ORD-${1000 + Number(sequence)}`;
  }
  const timestamp = Date.now().toString().slice(-4);
  return `PR3-ORD-${1000 + Number(timestamp) % 9000}`;
};

module.exports = generateOrderNumber;
