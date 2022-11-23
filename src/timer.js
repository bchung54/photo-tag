class Timer {
  constructor() {
    this.isRunning = false;
    this.startTime = 0;
    this.overallTime = 0;
  }

  getTimeElapsedSinceLastStart() {
    if (!this.startTime) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  start() {
    if (this.isRunning) {
      throw new Error('Timer is already running');
    }

    this.isRunning = true;

    this.startTime = Date.now();
  }

  stop() {
    if (!this.isRunning) {
      throw new Error('Timer is already stopped');
    }

    this.isRunning = false;

    this.overallTime += this.getTimeElapsedSinceLastStart();
  }

  reset() {
    this.overallTime = 0;

    if (this.isRunning) {
      this.startTime = Date.now();
      return;
    }

    this.startTime = 0;
  }

  getTime() {
    if (!this.startTime) {
      return 0;
    }

    if (this.isRunning) {
      return this.overallTime + this.getTimeElapsedSinceLastStart();
    }

    return this.overallTime;
  }
}
export default Timer;
