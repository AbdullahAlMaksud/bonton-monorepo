/**
 * Pure calculator logic for the expense amount keypad.
 * Evaluates basic arithmetic expressions safely with standard operator precedence.
 */

export function evaluateExpression(expr: string): string {
  if (!expr || expr.trim() === '') return '';

  // Replace unicode symbols with standard ASCII operators
  const sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();

  // Strip trailing operator, space, or decimal point
  const clean = sanitized.replace(/[\s+\-*/.]+$/, '').trim();
  if (!clean) return '';

  // Tokenize numbers and operators
  const tokens: (number | string)[] = [];
  let currentNum = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === ' ') continue;

    if (['+', '-', '*', '/'].includes(char)) {
      if (currentNum !== '') {
        const val = parseFloat(currentNum);
        if (!isNaN(val)) tokens.push(val);
        currentNum = '';
      } else if (
        char === '-' &&
        (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')
      ) {
        // Negative sign attached to next number
        currentNum = '-';
        continue;
      }
      tokens.push(char);
    } else if (/[0-9.]/.test(char)) {
      currentNum += char;
    }
  }

  if (currentNum !== '') {
    const val = parseFloat(currentNum);
    if (!isNaN(val)) tokens.push(val);
  }

  if (tokens.length === 0) return '';
  if (tokens.length === 1 && typeof tokens[0] === 'number') {
    return clean;
  }

  // Pass 1: Multiplication and Division
  const pass1: (number | string)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '*' || token === '/') {
      const prev = pass1.pop();
      const next = tokens[i + 1];
      if (typeof prev === 'number' && typeof next === 'number') {
        const res = token === '*' ? prev * next : next === 0 ? 0 : prev / next;
        pass1.push(res);
        i += 2;
        continue;
      }
    }
    pass1.push(token);
    i++;
  }

  // Pass 2: Addition and Subtraction
  let total = typeof pass1[0] === 'number' ? pass1[0] : 0;
  i = 1;
  while (i < pass1.length) {
    const op = pass1[i];
    const next = pass1[i + 1];
    if (typeof next === 'number') {
      if (op === '+') total += next;
      else if (op === '-') total -= next;
    }
    i += 2;
  }

  if (isNaN(total) || !isFinite(total)) return '0';
  // Round to at most 2 decimal places (standard currency)
  const rounded = Math.round(total * 100) / 100;
  return rounded.toString();
}

/**
 * Handles keypad press for digits, operators, decimal, and equals.
 */
export function handleKeypadPress(current: string, key: string): string {
  // 1. Equals: Evaluate the current expression
  if (key === '=') {
    return evaluateExpression(current);
  }

  // 2. Operators: +, −, ×, ÷
  if (['+', '−', '×', '÷'].includes(key)) {
    const trimmed = current.trim();
    if (!trimmed || trimmed === '0') return '';

    // If already ends with an operator, replace it
    const lastChar = trimmed.slice(-1);
    if (['+', '−', '×', '÷', '-', '*', '/'].includes(lastChar)) {
      return trimmed.slice(0, -1).trim() + ' ' + key + ' ';
    }

    // If there is already an operation waiting (e.g. "500 + 200"), evaluate first
    if (/[\s][+−×÷/*][\s]/.test(trimmed)) {
      const evaluated = evaluateExpression(trimmed);
      return evaluated ? evaluated + ' ' + key + ' ' : trimmed;
    }

    return trimmed + ' ' + key + ' ';
  }

  // 3. Decimal dot (.)
  if (key === '.') {
    if (!current || current === '0') return '0.';

    // Check last number segment
    const parts = current.trimEnd().split(/[\s+−×÷/*]+/);
    const lastPart = parts[parts.length - 1] ?? '';
    if (lastPart.includes('.')) {
      return current; // Already has a decimal in this token
    }
    if (lastPart === '' || current.endsWith(' ')) {
      return current + '0.';
    }
    return current + '.';
  }

  // 4. Digits: 0-9
  if (/^[0-9]$/.test(key)) {
    if (current === '0') {
      return key; // Replace initial zero
    }
    // Limit decimals to 2 places in current number token
    const parts = current.split(/[\s+−×÷/*]+/);
    const lastPart = parts[parts.length - 1] ?? '';
    if (lastPart.includes('.')) {
      const decimals = lastPart.split('.')[1] ?? '';
      if (decimals.length >= 2) {
        return current; // Maximum 2 decimal digits for money
      }
    }
    return current + key;
  }

  return current;
}

/**
 * Backspace deletion: removes last character or operator cluster.
 */
export function handleBackspace(current: string): string {
  if (!current) return '';
  const trimmed = current.trimEnd();
  // If ends with an operator with spaces, e.g. "500 + "
  if (/[\s][+−×÷/*]$/.test(trimmed)) {
    return trimmed.replace(/[\s][+−×÷/*]$/, '').trimEnd();
  }
  return trimmed.slice(0, -1);
}
