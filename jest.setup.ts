import { timeoutManager } from '@tanstack/react-query';

// React Query schedules cache-GC timers that can live for several minutes.
// They are useful in the app, but must not keep Node's test process alive
// after every rendered QueryClient has been unmounted.
timeoutManager.setTimeoutProvider({
  setTimeout: (callback, delay) => {
    const timer = setTimeout(callback, delay);
    (timer as unknown as { unref: () => void }).unref();
    return timer;
  },
  clearTimeout: (timer) => clearTimeout(timer),
  setInterval: (callback, delay) => {
    const timer = setInterval(callback, delay);
    (timer as unknown as { unref: () => void }).unref();
    return timer;
  },
  clearInterval: (timer) => clearInterval(timer),
});
