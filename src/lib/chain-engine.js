import { fillPromptVariables } from './prompt-utils.js';

/**
 * ChainEngine
 * Orchestrates multi-step AI workflows.
 */
export class ChainEngine {
  constructor({ adapter, queueController, onProgress }) {
    this.adapter = adapter;
    this.queueController = queueController;
    this.onProgress = onProgress;
    
    this.activeChain = null;
    this.variables = {};
    this.results = [];
    this.currentStepIndex = -1;
    this.stepTimeout = null;
    
    this.setupListeners();
  }

  setupListeners() {
    this.unsubscribe = this.adapter.onGeneratingEnd(() => {
      if (this.activeChain && this.currentStepIndex >= 0) {
        this.clearStepTimeout();
        this.handleStepCompletion();
      }
    });
  }

  clearStepTimeout() {
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }
  }

  startStepTimeout() {
    this.clearStepTimeout();
    this.stepTimeout = setTimeout(() => {
      if (this.activeChain) {
        console.warn(`[ChainEngine] Step ${this.currentStepIndex} timed out.`);
        this.handleError('AI generation timed out (120s limit).');
      }
    }, 120000); // 120s safety limit
  }

  /**
   * Starts a new chain execution.
   * @param {Object} chain { id, name, steps: [{ title, body, piped }] }
   * @param {Object} variables 
   */
  async startChain(chain, variables = {}) {
    this.activeChain = chain;
    this.variables = variables;
    this.results = [];
    this.currentStepIndex = 0;
    
    this.emitProgress();
    await this.executeCurrentStep();
  }

  async executeCurrentStep() {
    if (!this.activeChain) return;
    const step = this.activeChain.steps[this.currentStepIndex];
    if (!step) {
      this.completeChain();
      return;
    }

    // Resolve variables including {{LAST_RESULT}} and {{RESULTS[n]}}
    const lastResult = this.results[this.currentStepIndex - 1] || '';
    const mergedVariables = { ...this.variables, LAST_RESULT: lastResult };
    
    // Add RESULTS[n] support
    this.results.forEach((res, idx) => {
      mergedVariables[`RESULTS[${idx}]`] = res;
    });
    
    const resolvedText = fillPromptVariables(step.body, mergedVariables);
    
    // Add to queue and trigger
    this.queueController.enqueueText(resolvedText, 'chain_engine', {
      chainId: this.activeChain.id,
      chainName: this.activeChain.name,
      stepIndex: this.currentStepIndex,
      totalSteps: this.activeChain.steps.length
    });
    
    this.startStepTimeout();
    this.queueController.sendNow();
  }

  /**
   * Called when the adapter finishes generating a response.
   */
  handleStepCompletion() {
    const text = this.adapter.getLatestAssistantTurnText();
    this.results[this.currentStepIndex] = text;
    
    this.currentStepIndex++;
    this.emitProgress();
    
    // Schedule next step after a small delay to allow UI to settle
    setTimeout(() => this.executeCurrentStep(), 1500);
  }

  handleError(msg) {
    this.emitProgress('error', msg);
    this.activeChain = null;
    this.currentStepIndex = -1;
  }

  completeChain() {
    this.clearStepTimeout();
    const finalReport = {
      chain: this.activeChain,
      results: this.results,
      completedAt: Date.now()
    };
    
    this.activeChain = null;
    this.currentStepIndex = -1;
    this.emitProgress('completed');
  }

  cancelChain() {
    this.clearStepTimeout();
    this.activeChain = null;
    this.currentStepIndex = -1;
    this.emitProgress('cancelled');
  }

  emitProgress(status = 'running', error = null) {
    if (typeof this.onProgress === 'function') {
      this.onProgress({
        status,
        error,
        chainName: this.activeChain?.name || '',
        currentStep: this.currentStepIndex + 1,
        totalSteps: this.activeChain?.steps?.length || 0,
        results: [...this.results]
      });
    }
  }

  destroy() {
    this.clearStepTimeout();
    if (this.unsubscribe) this.unsubscribe();
  }
}
