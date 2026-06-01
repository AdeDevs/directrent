/**
 * Safely cleans, heals, and parses JSON strings that may contain markdown code blocks,
 * leading/trailing explanations, trailing commas, or incomplete/truncated structures.
 */
export function cleanAndParseJSON(rawText: string): any {
  if (!rawText) return getFallbackReport("Empty input received.");
  
  let cleaned = rawText.trim();
  
  // 1. Remove markdown code block wrapping
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  cleaned = cleaned.trim();
  
  // 2. Extract content starting from first structural character
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  
  if (startIdx === -1) {
    return getFallbackReport(rawText);
  }
  
  cleaned = cleaned.substring(startIdx);

  // Helper to heal and parse a candidate string
  function healAndParse(str: string): any {
    let inString = false;
    let isEscaped = false;
    const stack: { char: string; index: number }[] = [];
    const commasAtDepth: { [depth: number]: number[] } = {};

    let i = 0;
    for (; i < str.length; i++) {
      const char = str[i];
      if (inString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (char === '\\') {
          isEscaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        } else if (char === '{' || char === '[') {
          const depth = stack.length;
          stack.push({ char: char === '{' ? '}' : ']', index: i });
          commasAtDepth[depth + 1] = [];
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1].char === '}') {
            stack.pop();
          }
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1].char === ']') {
            stack.pop();
          }
        } else if (char === ',') {
          const depth = stack.length;
          if (!commasAtDepth[depth]) {
            commasAtDepth[depth] = [];
          }
          commasAtDepth[depth].push(i);
        }
      }
    }

    let candidate = str;
    // Close unclosed string
    if (inString) {
      if (candidate.endsWith('\\')) {
        candidate = candidate.slice(0, -1);
      }
      candidate += '"';
    }

    // Build the suffix to close open blocks
    let suffix = "";
    for (let j = stack.length - 1; j >= 0; j--) {
      suffix += stack[j].char;
    }

    let result = candidate + suffix;
    
    // Clean potential trailing commas before closing braces/brackets
    result = result.replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(result);
    } catch (e) {
      // If native parse fails, we have an incomplete structural element (like a dangling key or comma).
      // We'll roll back to the last safe structural break point.
      
      // Let's find the last outer comma at the deepest level
      const depth = stack.length;
      const levelCommas = commasAtDepth[depth] || [];
      if (levelCommas.length > 0) {
        const lastCommaIdx = levelCommas[levelCommas.length - 1];
        // Slice right before the comma
        const sliced = str.substring(0, lastCommaIdx);
        return healAndParse(sliced);
      }

      // If no commas exist at this level, check if we can truncate the current deepest structural entity entirely
      if (stack.length > 0) {
        const lastOpen = stack[stack.length - 1];
        // Slice to right before the open character (or open structure)
        const sliced = str.substring(0, lastOpen.index);
        return healAndParse(sliced);
      }

      throw e;
    }
  }

  try {
    const rawParsed = healAndParse(cleaned);
    return normalizeReport(rawParsed);
  } catch (err) {
    console.error("JSON repair pipeline could not parse raw content:", rawText);
    return getFallbackReport(rawText);
  }
}

function getFallbackReport(rawText: string): any {
  // Try to find if recommendation was approve/flag/reject inside the text
  const lower = rawText.toLowerCase();
  let recommendation = "flag";
  if (lower.includes('"recommendation":"approve"') || lower.includes("recommendation: approve") || lower.includes("approve listing")) {
    recommendation = "approve";
  } else if (lower.includes('"recommendation":"reject"') || lower.includes("recommendation: reject") || lower.includes("reject listing")) {
    recommendation = "reject";
  }

  return normalizeReport({
    analysis: rawText.replace(/[\{\}\"\[\]]/g, " ").trim(),
    recommendation,
    confidence: 60
  });
}

function normalizeReport(obj: any): any {
  if (!obj || typeof obj !== "object") {
    obj = {};
  }

  // 1. Check for analysis or extract from anywhere
  if (!obj.analysis || typeof obj.analysis !== "string") {
    obj.analysis = obj.analysis || "AI Analysis completed. Reviewing listing price cross-referenced with area data, pros/cons, and image attachments.";
  }

  // 2. Ensure recommendation is normalized to approve / flag / reject
  if (!obj.recommendation || typeof obj.recommendation !== "string") {
    const rawTextLower = JSON.stringify(obj).toLowerCase();
    if (rawTextLower.includes('"recommendation":"approve"') || rawTextLower.includes("recommendation: approve")) {
      obj.recommendation = "approve";
    } else if (rawTextLower.includes('"recommendation":"reject"') || rawTextLower.includes("recommendation: reject")) {
      obj.recommendation = "reject";
    } else {
      obj.recommendation = "flag";
    }
  } else {
    const rec = obj.recommendation.toLowerCase().trim();
    if (rec.includes("approve")) obj.recommendation = "approve";
    else if (rec.includes("reject")) obj.recommendation = "reject";
    else obj.recommendation = "flag";
  }

  // 3. Ensure confidence is a number (0-100)
  if (obj.confidence === undefined || obj.confidence === null) {
    obj.confidence = 75; // Default safe confidence
  } else {
    let confNum = parseFloat(obj.confidence);
    if (isNaN(confNum)) {
      obj.confidence = 75;
    } else {
      if (confNum <= 1) {
        confNum = confNum * 100;
      }
      obj.confidence = Math.min(100, Math.max(0, confNum));
    }
  }

  // 4. Ensure assessment block exists
  if (!obj.assessment || typeof obj.assessment !== "object") {
    obj.assessment = {};
  }

  // Normalize pricing
  if (!obj.assessment.pricing || typeof obj.assessment.pricing !== "string") {
    // Check if we can infer from the analysis body
    const textToSearch = obj.analysis.toLowerCase();
    if (textToSearch.includes("suspicious") || textToSearch.includes("impossible") || textToSearch.includes("bait") || textToSearch.includes("extremely low")) {
      obj.assessment.pricing = "suspiciously_low";
    } else if (textToSearch.includes("expensive") || textToSearch.includes("high price") || textToSearch.includes("too high")) {
      obj.assessment.pricing = "high";
    } else {
      obj.assessment.pricing = "fair";
    }
  } else {
    const pr = obj.assessment.pricing.toLowerCase().trim();
    if (pr.includes("suspicious") || pr.includes("low")) obj.assessment.pricing = "suspiciously_low";
    else if (pr.includes("high")) obj.assessment.pricing = "high";
    else obj.assessment.pricing = "fair";
  }

  // Normalize imageQuality
  if (!obj.assessment.imageQuality || typeof obj.assessment.imageQuality !== "string") {
    const textToSearch = obj.analysis.toLowerCase();
    if (textToSearch.includes("no image") || textToSearch.includes("screenshot") || textToSearch.includes("poor image") || textToSearch.includes("low quality")) {
      obj.assessment.imageQuality = "low";
    } else if (textToSearch.includes("clear") || textToSearch.includes("high quality") || textToSearch.includes("excellent")) {
      obj.assessment.imageQuality = "high";
    } else {
      obj.assessment.imageQuality = "average";
    }
  } else {
    const iq = obj.assessment.imageQuality.toLowerCase().trim();
    if (iq.includes("high")) obj.assessment.imageQuality = "high";
    else if (iq.includes("low")) obj.assessment.imageQuality = "low";
    else obj.assessment.imageQuality = "average";
  }

  // Normalize riskLevel
  if (!obj.assessment.riskLevel || typeof obj.assessment.riskLevel !== "string") {
    if (obj.recommendation === "approve") {
      obj.assessment.riskLevel = "low";
    } else if (obj.recommendation === "reject") {
      obj.assessment.riskLevel = "high";
    } else {
      obj.assessment.riskLevel = "medium";
    }
  } else {
    const rl = obj.assessment.riskLevel.toLowerCase().trim();
    if (rl.includes("low")) obj.assessment.riskLevel = "low";
    else if (rl.includes("high")) obj.assessment.riskLevel = "high";
    else obj.assessment.riskLevel = "medium";
  }

  return obj;
}
