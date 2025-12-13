import { ConsoleView } from '../views/ConsoleView';

export class CapturingView extends ConsoleView {
  public lastSuccess: any = null;
  public lastError: string | null = null;
  public hasError: boolean = false;

  renderSuccess(data: any): void {
    super.renderSuccess(data); // Optionally keep logging
    this.lastSuccess = data;
    this.hasError = false;
  }

  renderError(error: string): void {
    super.renderError(error);
    this.lastError = error;
    this.hasError = true;
  }

  reset(): void {
    this.lastSuccess = null;
    this.lastError = null;
    this.hasError = false;
  }
}
