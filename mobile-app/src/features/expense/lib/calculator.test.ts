import { describe, expect, it } from 'bun:test';
import {
  evaluateExpression,
  handleBackspace,
  handleKeypadPress,
} from './calculator';

describe('calculator logic', () => {
  it('evaluates basic numbers and arithmetic', () => {
    expect(evaluateExpression('789')).toBe('789');
    expect(evaluateExpression('500 + 289')).toBe('789');
    expect(evaluateExpression('1000 − 250')).toBe('750');
    expect(evaluateExpression('50 × 4')).toBe('200');
    expect(evaluateExpression('100 ÷ 4')).toBe('25');
  });

  it('handles operator precedence correctly', () => {
    expect(evaluateExpression('100 + 50 × 2')).toBe('200');
    expect(evaluateExpression('200 − 50 × 2')).toBe('100');
  });

  it('handles decimals and rounding to 2 places', () => {
    expect(evaluateExpression('10 ÷ 3')).toBe('3.33');
    expect(evaluateExpression('5.5 + 4.5')).toBe('10');
    expect(evaluateExpression('5.25 + 2.10')).toBe('7.35');
  });

  it('strips trailing operators safely', () => {
    expect(evaluateExpression('500 + ')).toBe('500');
    expect(evaluateExpression('500 × ')).toBe('500');
    expect(evaluateExpression('')).toBe('');
  });

  it('handles keypad button presses', () => {
    let expr = '';
    expr = handleKeypadPress(expr, '7');
    expect(expr).toBe('7');
    expr = handleKeypadPress(expr, '8');
    expect(expr).toBe('78');
    expr = handleKeypadPress(expr, '9');
    expect(expr).toBe('789');

    // Add operator
    expr = handleKeypadPress(expr, '+');
    expect(expr).toBe('789 + ');

    // Add number
    expr = handleKeypadPress(expr, '1');
    expr = handleKeypadPress(expr, '1');
    expect(expr).toBe('789 + 11');

    // Equals
    expr = handleKeypadPress(expr, '=');
    expect(expr).toBe('800');
  });

  it('handles backspace', () => {
    expect(handleBackspace('789')).toBe('78');
    expect(handleBackspace('78')).toBe('7');
    expect(handleBackspace('7')).toBe('');
    expect(handleBackspace('')).toBe('');
    expect(handleBackspace('500 + ')).toBe('500');
  });
});
