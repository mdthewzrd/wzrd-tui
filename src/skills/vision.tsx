// Vision Skill for WZRD TUI
// Provides screenshot analysis and visual comparison capabilities

import { createSignal, createEffect } from "solid-js";

export interface VisionConfig {
  enabled: boolean;
  autoAnalyze: boolean;
  supportedFormats: string[];
}

export interface ScreenshotAnalysis {
  timestamp: string;
  filename: string;
  description: string;
  differences: string[];
  recommendations: string[];
}

export class VisionSkill {
  private config: VisionConfig;
  private analysisHistory: ScreenshotAnalysis[] = [];

  constructor(config: VisionConfig = { enabled: true, autoAnalyze: true, supportedFormats: ["png", "jpg", "jpeg"] }) {
    this.config = config;
  }

  // Analyze a screenshot and compare to target
  async analyzeScreenshot(imagePath: string, targetReference?: string): Promise<ScreenshotAnalysis> {
    console.log(`[Vision] Analyzing screenshot: ${imagePath}`);
    
    // In a real implementation, this would:
    // 1. Load the image
    // 2. Run computer vision analysis
    // 3. Compare to reference if provided
    // 4. Return structured analysis
    
    const analysis: ScreenshotAnalysis = {
      timestamp: new Date().toISOString(),
      filename: imagePath,
      description: "Screenshot captured for analysis",
      differences: [],
      recommendations: []
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  // Compare two screenshots and identify differences
  async compareScreenshots(current: string, target: string): Promise<string[]> {
    console.log(`[Vision] Comparing ${current} vs ${target}`);
    
    // Mock differences for TUI development
    return [
      "Header alignment differs by 2px",
      "Sidebar width is 5% wider than target",
      "Message padding needs adjustment",
      "Color contrast in bottom bar"
    ];
  }

  // Get visual feedback for TUI element
  getElementFeedback(element: string): string {
    const feedback: Record<string, string> = {
      "header": "Header looks good. Session title and model info are well positioned.",
      "messages": "Messages need work. Add grey background boxes for user messages.",
      "sidebar": "Sidebar is close. Context stats and LSP section match well.",
      "input": "Input area needs arrow prompt and better spacing.",
      "bottom-bar": "Bottom bar matches Opencode style well."
    };
    
    return feedback[element] || "No specific feedback for this element.";
  }

  // Auto-suggest improvements based on visual analysis
  suggestImprovements(): string[] {
    return [
      "Add message background boxes (grey for user)",
      "Include agent/model info below each assistant message",
      "Add response time indicators",
      "Implement attachment tags (img, clipboard)",
      "Add status indicators (complete, interrupted, thinking)"
    ];
  }

  getHistory(): ScreenshotAnalysis[] {
    return this.analysisHistory;
  }
}

// Hook for using vision skill in components
export function useVision() {
  const [vision] = createSignal(new VisionSkill());
  const [lastAnalysis, setLastAnalysis] = createSignal<ScreenshotAnalysis | null>(null);

  const analyze = async (imagePath: string) => {
    const result = await vision().analyzeScreenshot(imagePath);
    setLastAnalysis(result);
    return result;
  };

  const compare = async (current: string, target: string) => {
    return await vision().compareScreenshots(current, target);
  };

  return {
    vision,
    lastAnalysis,
    analyze,
    compare,
    getFeedback: (element: string) => vision().getElementFeedback(element),
    getSuggestions: () => vision().suggestImprovements()
  };
}

export default VisionSkill;
