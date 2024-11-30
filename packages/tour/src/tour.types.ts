export interface Step {
  selector: string;
  title: string;
  description: string;
}

export interface Config {
  steps: Step[];
}

export interface TourState {
  config: Config | null;
  currentStep: number;
}
