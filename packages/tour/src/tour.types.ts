export interface Step {
  selector: string;
  title: string;
  text: string;
}

export interface Config {
  steps: Step[];
}

export interface TourState {
  config: Config | null;
  currentStep: number;
  cleanup: (() => void) | null;
}
