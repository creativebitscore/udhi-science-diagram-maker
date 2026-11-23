import { describe, it, expect } from 'vitest';
import { SvgValidator } from '../services/svg-validator.service.js';

describe('SvgValidator Service', () => {
  const validator = new SvgValidator();

  const validSampleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <title>Pythagoras Theorem Diagram</title>
      <style>
        @keyframes pulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }
        .glow { animation: pulse 2s infinite alternate; }
      </style>
      <rect x="50" y="50" width="200" height="150" fill="#2563eb" class="glow" />
      <circle cx="400" cy="300" r="40" fill="#10b981" />
      <text x="60" y="80">Hypotenuse C</text>
      <text x="60" y="110">Side A</text>
      <text x="60" y="140">Side B</text>
    </svg>
  `;

  it('validates a completely compliant SVG successfully', () => {
    const result = validator.validate(validSampleSvg);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks).toHaveLength(5);
    result.checks.forEach((c) => expect(c.passed).toBe(true));
  });

  it('fails Check 1 when XML is malformed or unclosed', () => {
    const brokenSvg = `<svg viewBox="0 0 500 500"><title>Test</title><rect x="10" y="10" width="50" height="50">`;
    const result = validator.validate(brokenSvg);
    expect(result.isValid).toBe(false);
    expect(result.checks.find((c) => c.checkId === 'xml_valid')?.passed).toBe(false);
  });

  it('fails Check 2 when an element is drawn outside the viewBox bounds', () => {
    const outOfBoundsSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <title>Out of Bounds Test</title>
        <circle cx="700" cy="250" r="50" fill="red">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="100">Label 1</text>
        <text x="100" y="150">Label 2</text>
        <text x="100" y="200">Label 3</text>
      </svg>
    `;
    const result = validator.validate(outOfBoundsSvg);
    expect(result.isValid).toBe(false);
    const vbCheck = result.checks.find((c) => c.checkId === 'viewbox_bounds');
    expect(vbCheck?.passed).toBe(false);
    expect(vbCheck?.message).toContain('outside viewBox');
  });

  it('fails Check 3 when <title> is missing or there are fewer than 3 text labels', () => {
    const missingLabelsSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <title>Some Title</title>
        <circle cx="250" cy="250" r="50">
          <animate attributeName="r" values="30;50;30" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="100">Only One Label</text>
      </svg>
    `;
    const result = validator.validate(missingLabelsSvg);
    expect(result.isValid).toBe(false);
    const labelCheck = result.checks.find((c) => c.checkId === 'title_and_labels');
    expect(labelCheck?.passed).toBe(false);
    expect(labelCheck?.message).toContain('At least 3 meaningful text labels');
  });

  it('fails Check 4 when no SMIL or CSS animation is present', () => {
    const staticSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <title>Static Test</title>
        <circle cx="250" cy="250" r="50" fill="blue" />
        <text x="100" y="100">Label 1</text>
        <text x="100" y="150">Label 2</text>
        <text x="100" y="200">Label 3</text>
      </svg>
    `;
    const result = validator.validate(staticSvg);
    expect(result.isValid).toBe(false);
    const animCheck = result.checks.find((c) => c.checkId === 'has_animation');
    expect(animCheck?.passed).toBe(false);
    expect(animCheck?.message).toContain('No animation detected');
  });

  it('fails Check 5 (Security) if <script>, <foreignObject>, or external URLs are present', () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <title>Injected Script</title>
        <script>alert("XSS")</script>
        <circle cx="250" cy="250" r="50">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="100">Label 1</text>
        <text x="100" y="150">Label 2</text>
        <text x="100" y="200">Label 3</text>
      </svg>
    `;
    const result = validator.validate(maliciousSvg);
    expect(result.isValid).toBe(false);
    const secCheck = result.checks.find((c) => c.checkId === 'security_clean');
    expect(secCheck?.passed).toBe(false);
    expect(secCheck?.message).toContain('Contains forbidden <script>');
  });

  it('extracts and cleans SVG when wrapped inside markdown code blocks', () => {
    const wrapped = "```xml\n" + validSampleSvg.trim() + "\n```";
    const cleaned = validator.cleanSvgString(wrapped);
    expect(cleaned.startsWith('<svg')).toBe(true);
    expect(cleaned.endsWith('</svg>')).toBe(true);
  });
});
