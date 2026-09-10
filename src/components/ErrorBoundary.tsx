import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button } from '@mantine/core';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Page failed to render', error, info.componentStack); }
  render() {
    if (this.state.failed) return <Alert color="red" title="Unable to display this page">
      Reload to get the latest version of the application.
      <Button ml="md" onClick={() => window.location.reload()}>Reload</Button>
    </Alert>;
    return this.props.children;
  }
}
