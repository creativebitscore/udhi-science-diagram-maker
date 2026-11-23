import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { ValidationCheckResult, ValidationSummary } from '../types/index.js';

interface ViewBoxRect {
  minX: number;
  minY: number;
  width: number;
  height: number;
  maxX: number;
  maxY: number;
}

export class SvgValidator {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      preserveOrder: true,
    });
  }

  /**
   * Sanitizes input to extract pure SVG markup if wrapped in markdown codeblocks
   */
  public cleanSvgString(raw: string): string {
    let cleaned = raw.trim();
    // Remove markdown codeblock fence if model added it
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }
    // Extract substring between <svg and </svg>
    const startIdx = cleaned.indexOf('<svg');
    const endIdx = cleaned.lastIndexOf('</svg>');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 6);
    }
    return cleaned.trim();
  }

  /**
   * Runs all 5 validation checks on the given SVG string
   */
  public validate(rawSvg: string): ValidationSummary {
    const svg = this.cleanSvgString(rawSvg);
    const checks: ValidationCheckResult[] = [];
    const errors: string[] = [];

    // Check 1: XML Parsing
    const xmlCheck = this.checkXmlValidity(svg);
    checks.push(xmlCheck);
    if (!xmlCheck.passed) {
      errors.push(xmlCheck.message);
      // If basic XML fails to parse, subsequent structural checks cannot reliably run
      return {
        isValid: false,
        checks: [
          xmlCheck,
          { checkId: 'viewbox_bounds', name: 'ViewBox Bounds', passed: false, message: 'Skipped due to XML parse failure' },
          { checkId: 'title_and_labels', name: 'Title and Labels', passed: false, message: 'Skipped due to XML parse failure' },
          { checkId: 'has_animation', name: 'Animation Presence', passed: false, message: 'Skipped due to XML parse failure' },
          { checkId: 'security_clean', name: 'Security & Integrity', passed: false, message: 'Skipped due to XML parse failure' },
        ],
        errors,
      };
    }

    // Check 2: ViewBox Bounds
    const viewBoxCheck = this.checkViewBoxBounds(svg);
    checks.push(viewBoxCheck);
    if (!viewBoxCheck.passed) {
      errors.push(viewBoxCheck.message);
    }

    // Check 3: Title and at least 3 meaningful text labels
    const titleAndLabelsCheck = this.checkTitleAndLabels(svg);
    checks.push(titleAndLabelsCheck);
    if (!titleAndLabelsCheck.passed) {
      errors.push(titleAndLabelsCheck.message);
    }

    // Check 4: At least one CSS or SMIL animation
    const animationCheck = this.checkAnimation(svg);
    checks.push(animationCheck);
    if (!animationCheck.passed) {
      errors.push(animationCheck.message);
    }

    // Check 5 (Custom Check): Security & Integrity (Reject <script>, <foreignObject>, external URLs)
    const securityCheck = this.checkSecurity(svg);
    checks.push(securityCheck);
    if (!securityCheck.passed) {
      errors.push(securityCheck.message);
    }

    const isValid = checks.every((c) => c.passed);

    return {
      isValid,
      checks,
      errors,
    };
  }

  /**
   * Check 1: SVG is valid XML and parses without errors
   */
  private checkXmlValidity(svg: string): ValidationCheckResult {
    if (!svg || svg.trim().length === 0) {
      return {
        checkId: 'xml_valid',
        name: 'Valid XML/SVG',
        passed: false,
        message: 'SVG string is empty or missing.',
      };
    }

    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      return {
        checkId: 'xml_valid',
        name: 'Valid XML/SVG',
        passed: false,
        message: 'SVG does not contain valid root <svg> and </svg> tags.',
      };
    }

    const validationResult = XMLValidator.validate(svg);
    if (validationResult !== true) {
      return {
        checkId: 'xml_valid',
        name: 'Valid XML/SVG',
        passed: false,
        message: `XML syntax error: ${validationResult.err.msg} at line ${validationResult.err.line}, col ${validationResult.err.col}`,
      };
    }

    try {
      this.parser.parse(svg);
      return {
        checkId: 'xml_valid',
        name: 'Valid XML/SVG',
        passed: true,
        message: 'SVG is well-formed XML and parsed successfully.',
      };
    } catch (err: unknown) {
      return {
        checkId: 'xml_valid',
        name: 'Valid XML/SVG',
        passed: false,
        message: `Parser exception: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Check 2: All drawable elements remain within the defined viewBox
   */
  private checkViewBoxBounds(svg: string): ValidationCheckResult {
    // Extract viewBox attribute
    const viewBoxMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    if (!viewBoxMatch) {
      return {
        checkId: 'viewbox_bounds',
        name: 'ViewBox Bounds',
        passed: false,
        message: 'Missing viewBox attribute on <svg> element.',
      };
    }

    const vbParts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (vbParts.length !== 4 || vbParts.some(isNaN)) {
      return {
        checkId: 'viewbox_bounds',
        name: 'ViewBox Bounds',
        passed: false,
        message: `Invalid viewBox format: "${viewBoxMatch[1]}". Expected 4 numbers (minX minY width height).`,
      };
    }

    const [minX, minY, width, height] = vbParts;
    if (width <= 0 || height <= 0) {
      return {
        checkId: 'viewbox_bounds',
        name: 'ViewBox Bounds',
        passed: false,
        message: `Invalid viewBox dimensions: width=${width}, height=${height}. Must be positive.`,
      };
    }

    const vb: ViewBoxRect = {
      minX,
      minY,
      width,
      height,
      maxX: minX + width,
      maxY: minY + height,
    };

    // Tolerance buffer for visual strokes / antialiasing (e.g. 5px or 1%)
    const tolerance = 5;
    const violations: string[] = [];

    // Check circles: cx, cy, r
    const circleRegex = /<circle\b([^>]*)\/?>/gi;
    let match;
    while ((match = circleRegex.exec(svg)) !== null) {
      const attrs = match[1];
      const cx = this.getNumericAttr(attrs, 'cx');
      const cy = this.getNumericAttr(attrs, 'cy');
      const r = this.getNumericAttr(attrs, 'r');
      if (cx !== null && cy !== null && r !== null) {
        if (
          cx - r < vb.minX - tolerance ||
          cx + r > vb.maxX + tolerance ||
          cy - r < vb.minY - tolerance ||
          cy + r > vb.maxY + tolerance
        ) {
          violations.push(
            `Circle at (${cx}, ${cy}) with radius ${r} extends outside viewBox [${vb.minX}, ${vb.minY}, ${vb.maxX}, ${vb.maxY}]`
          );
        }
      }
    }

    // Check rects: x, y, width, height
    const rectRegex = /<rect\b([^>]*)\/?>/gi;
    while ((match = rectRegex.exec(svg)) !== null) {
      const attrs = match[1];
      const x = this.getNumericAttr(attrs, 'x') ?? 0;
      const y = this.getNumericAttr(attrs, 'y') ?? 0;
      const w = this.getNumericAttr(attrs, 'width');
      const h = this.getNumericAttr(attrs, 'height');
      if (w !== null && h !== null) {
        if (
          x < vb.minX - tolerance ||
          x + w > vb.maxX + tolerance ||
          y < vb.minY - tolerance ||
          y + h > vb.maxY + tolerance
        ) {
          violations.push(
            `Rect at (${x}, ${y}) size ${w}x${h} extends outside viewBox [${vb.minX}, ${vb.minY}, ${vb.maxX}, ${vb.maxY}]`
          );
        }
      }
    }

    // Check lines: x1, y1, x2, y2
    const lineRegex = /<line\b([^>]*)\/?>/gi;
    while ((match = lineRegex.exec(svg)) !== null) {
      const attrs = match[1];
      const x1 = this.getNumericAttr(attrs, 'x1');
      const y1 = this.getNumericAttr(attrs, 'y1');
      const x2 = this.getNumericAttr(attrs, 'x2');
      const y2 = this.getNumericAttr(attrs, 'y2');
      if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
        if (
          x1 < vb.minX - tolerance ||
          x1 > vb.maxX + tolerance ||
          x2 < vb.minX - tolerance ||
          x2 > vb.maxX + tolerance ||
          y1 < vb.minY - tolerance ||
          y1 > vb.maxY + tolerance ||
          y2 < vb.minY - tolerance ||
          y2 > vb.maxY + tolerance
        ) {
          violations.push(
            `Line from (${x1}, ${y1}) to (${x2}, ${y2}) extends outside viewBox [${vb.minX}, ${vb.minY}, ${vb.maxX}, ${vb.maxY}]`
          );
        }
      }
    }

    // Check texts: x, y
    const textRegex = /<text\b([^>]*)>([^<]*)<\/text>/gi;
    while ((match = textRegex.exec(svg)) !== null) {
      const attrs = match[1];
      const content = match[2].trim();
      const x = this.getNumericAttr(attrs, 'x');
      const y = this.getNumericAttr(attrs, 'y');
      if (x !== null && y !== null) {
        if (
          x < vb.minX - tolerance ||
          x > vb.maxX + tolerance ||
          y < vb.minY - tolerance ||
          y > vb.maxY + tolerance
        ) {
          violations.push(
            `Text label "${content.substring(0, 20)}" at (${x}, ${y}) positioned outside viewBox [${vb.minX}, ${vb.minY}, ${vb.maxX}, ${vb.maxY}]`
          );
        }
      }
    }

    if (violations.length > 0) {
      return {
        checkId: 'viewbox_bounds',
        name: 'ViewBox Bounds',
        passed: false,
        message: `${violations.length} element(s) drawn outside viewBox bounds: ${violations.slice(0, 2).join('; ')}`,
        details: { violations },
      };
    }

    return {
      checkId: 'viewbox_bounds',
      name: 'ViewBox Bounds',
      passed: true,
      message: `All elements reside safely within viewBox [${vb.minX}, ${vb.minY}, ${vb.width}, ${vb.height}].`,
      details: { viewBox: vb },
    };
  }

  /**
   * Check 3: Has a <title> and at least 3 text labels
   */
  private checkTitleAndLabels(svg: string): ValidationCheckResult {
    // Check for <title> tag
    const titleMatch = svg.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const hasTitle = Boolean(titleMatch && titleMatch[1].trim().length > 0);

    // Collect text labels from <text>...</text>
    const textRegex = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
    const labels: string[] = [];
    let match;
    while ((match = textRegex.exec(svg)) !== null) {
      // Strip any nested tags like <tspan>
      const cleanText = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanText.length > 0) {
        labels.push(cleanText);
      }
    }

    // Deduplicate labels to ensure meaningful diversity
    const distinctLabels = Array.from(new Set(labels));

    const titlePassed = hasTitle;
    const labelsPassed = distinctLabels.length >= 3;

    if (!titlePassed && !labelsPassed) {
      return {
        checkId: 'title_and_labels',
        name: 'Title and Labels',
        passed: false,
        message: `Missing <title> tag and found only ${distinctLabels.length} distinct text label(s) (requires at least 3).`,
        details: { labels: distinctLabels },
      };
    }

    if (!titlePassed) {
      return {
        checkId: 'title_and_labels',
        name: 'Title and Labels',
        passed: false,
        message: 'SVG is missing a descriptive <title> tag.',
        details: { labels: distinctLabels },
      };
    }

    if (!labelsPassed) {
      return {
        checkId: 'title_and_labels',
        name: 'Title and Labels',
        passed: false,
        message: `Found ${distinctLabels.length} text label(s) ("${distinctLabels.join('", "')}"). At least 3 meaningful text labels are required.`,
        details: { labels: distinctLabels },
      };
    }

    return {
      checkId: 'title_and_labels',
      name: 'Title and Labels',
      passed: true,
      message: `SVG has valid title "${titleMatch![1].trim()}" and ${distinctLabels.length} distinct text labels.`,
      details: { title: titleMatch![1].trim(), labelCount: distinctLabels.length, labels: distinctLabels },
    };
  }

  /**
   * Check 4: Has at least one CSS or SMIL animation
   */
  private checkAnimation(svg: string): ValidationCheckResult {
    // SMIL animation tags
    const smilTags = ['<animate ', '<animate\n', '<animateTransform', '<animateMotion', '<set '];
    const hasSmil = smilTags.some((tag) => svg.toLowerCase().includes(tag));

    // CSS keyframes or animation properties
    const hasKeyframes = /@keyframes\s+[a-zA-Z0-9_-]+/i.test(svg);
    const hasCssAnimation = /animation\s*:\s*[^;}]+/i.test(svg);

    const animationFound = hasSmil || (hasKeyframes && hasCssAnimation);

    if (!animationFound) {
      return {
        checkId: 'has_animation',
        name: 'Animation Presence',
        passed: false,
        message: 'No animation detected. Diagram must contain either SMIL (<animate>, <animateTransform>) or CSS (@keyframes & animation property).',
      };
    }

    const type = hasSmil && hasKeyframes ? 'Both SMIL and CSS keyframes' : hasSmil ? 'SMIL animation' : 'CSS @keyframes';

    return {
      checkId: 'has_animation',
      name: 'Animation Presence',
      passed: true,
      message: `Detected active animation via ${type}.`,
      details: { hasSmil, hasKeyframes, hasCssAnimation },
    };
  }

  /**
   * Check 5 (Custom Check): Security & Integrity
   * Rejects external scripts, foreignObject elements, inline JS handlers, and external URLs
   */
  private checkSecurity(svg: string): ValidationCheckResult {
    const issues: string[] = [];

    // Disallow <script>
    if (/<script\b/i.test(svg)) {
      issues.push('Contains forbidden <script> element');
    }

    // Disallow <foreignObject>
    if (/<foreignObject\b/i.test(svg)) {
      issues.push('Contains forbidden <foreignObject> element');
    }

    // Disallow inline JavaScript event handlers (e.g. onload, onclick, onmouseover)
    const eventHandlerRegex = /\bon[a-z]+\s*=\s*["'][^"']*["']/i;
    if (eventHandlerRegex.test(svg)) {
      issues.push('Contains inline JavaScript event handler (e.g., onload, onclick)');
    }

    // Disallow external resource URLs in href or xlink:href (must not load external images/scripts)
    const externalUrlRegex = /(?:href|src|url)\s*=\s*["'](https?:\/\/|\/\/)/i;
    if (externalUrlRegex.test(svg)) {
      issues.push('Contains external network URL reference');
    }

    // Disallow javascript: URIs
    if (/javascript\s*:/i.test(svg)) {
      issues.push('Contains javascript: URI scheme');
    }

    if (issues.length > 0) {
      return {
        checkId: 'security_clean',
        name: 'Security & Integrity',
        passed: false,
        message: `Security validation failed: ${issues.join('; ')}`,
        details: { issues },
      };
    }

    return {
      checkId: 'security_clean',
      name: 'Security & Integrity',
      passed: true,
      message: 'SVG is secure: no external scripts, foreignObject, or untrusted external URLs.',
    };
  }

  private getNumericAttr(attrsString: string, attrName: string): number | null {
    const regex = new RegExp(`(?:^|\\s)${attrName}\\s*=\\s*["']([+-]?\\d*(?:\\.\\d+)?(?:px)?)["']`, 'i');
    const match = attrsString.match(regex);
    if (!match) return null;
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  }
}

export const svgValidator = new SvgValidator();
