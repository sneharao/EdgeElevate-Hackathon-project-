import type { EdgeElevateResponse } from '../types/edgeElevate';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface StepUpdate {
  step: string;
  label: string;
}

export function streamEdgeElevateAnalysis(
  startupName: string,
  onStep: (update: StepUpdate) => void,
  onComplete: (result: EdgeElevateResponse) => void,
  onError: (error: Error) => void
): () => void {
  const eventSource = new EventSource(
    `${BACKEND_URL}/api/edge-elevate/stream?startup_name=${encodeURIComponent(startupName)}`
  );

  eventSource.addEventListener('step', (event) => {
    const data = JSON.parse(event.data);
    onStep(data);
  });

  eventSource.addEventListener('complete', (event) => {
    const result = JSON.parse(event.data);
    eventSource.close();
    onComplete(result);
  });

  eventSource.onerror = (event) => {
    console.error('EventSource error:', event);
    console.error('ReadyState:', eventSource.readyState);
    eventSource.close();
    onError(new Error('Connection lost'));
  };

  eventSource.addEventListener('error', (event: MessageEvent) => {
    console.error('Stream error event:', event.data);
    const error = JSON.parse(event.data);
    eventSource.close();
    onError(new Error(error.error || 'Stream error'));
  });

  // Return cleanup function
  return () => eventSource.close();
}
