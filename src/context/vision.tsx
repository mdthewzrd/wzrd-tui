// Vision Provider for WZRD TUI
// Integrates vision skill into the TUI context

import { createContext, useContext, createSignal, type JSX } from "solid-js";
import { VisionSkill, type ScreenshotAnalysis } from "../skills/vision";

interface VisionContextType {
  vision: VisionSkill;
  isAnalyzing: () => boolean;
  lastAnalysis: () => ScreenshotAnalysis | null;
  analyzeScreenshot: (path: string) => Promise<ScreenshotAnalysis>;
  compareToTarget: (current: string, target: string) => Promise<string[]>;
  getElementFeedback: (element: string) => string;
  getImprovementSuggestions: () => string[];
}

const VisionContext = createContext<VisionContextType>();

export function VisionProvider(props: { children: JSX.Element }) {
  const [vision] = createSignal(new VisionSkill());
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [lastAnalysis, setLastAnalysis] = createSignal<ScreenshotAnalysis | null>(null);

  const analyzeScreenshot = async (path: string): Promise<ScreenshotAnalysis> => {
    setIsAnalyzing(true);
    try {
      const result = await vision().analyzeScreenshot(path);
      setLastAnalysis(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const compareToTarget = async (current: string, target: string): Promise<string[]> => {
    setIsAnalyzing(true);
    try {
      return await vision().compareScreenshots(current, target);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const value: VisionContextType = {
    vision: vision(),
    isAnalyzing,
    lastAnalysis,
    analyzeScreenshot,
    compareToTarget,
    getElementFeedback: (element: string) => vision().getElementFeedback(element),
    getImprovementSuggestions: () => vision().suggestImprovements()
  };

  return (
    <VisionContext.Provider value={value}>
      {props.children}
    </VisionContext.Provider>
  );
}

export function useVision() {
  const context = useContext(VisionContext);
  if (!context) {
    throw new Error("useVision must be used within a VisionProvider");
  }
  return context;
}

export default VisionProvider;
