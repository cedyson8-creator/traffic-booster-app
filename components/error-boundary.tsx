import React, { ReactNode, ErrorInfo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 * Prevents the entire app from crashing on component errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View className="flex-1 bg-background p-6 justify-center">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Error Icon */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-error/10 items-center justify-center mb-4">
                <Text className="text-4xl">⚠️</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground text-center">
                Oops! Something went wrong
              </Text>
            </View>

            {/* Error Message */}
            <View className="bg-error/5 border border-error/20 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-error mb-2">Error Details:</Text>
              <Text className="text-sm text-foreground font-mono">
                {this.state.error.message}
              </Text>
            </View>

            {/* Stack Trace (Development Only) */}
            {__DEV__ && this.state.errorInfo && (
              <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
                <Text className="text-xs font-semibold text-muted mb-2">Stack Trace:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text className="text-xs text-muted font-mono">
                    {this.state.errorInfo.componentStack}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* Error Recovery Tips */}
            <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">Try these steps:</Text>
              <Text className="text-sm text-muted leading-relaxed mb-2">
                • Tap the "Try Again" button below to recover
              </Text>
              <Text className="text-sm text-muted leading-relaxed mb-2">
                • Close and reopen the app if the problem persists
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Check your internet connection
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={this.resetError}
                className="bg-primary rounded-lg py-4 items-center active:opacity-80"
              >
                <Text className="text-background font-semibold text-base">Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // Could navigate to home or reload app
                  this.resetError();
                }}
                className="bg-surface border border-border rounded-lg py-4 items-center active:opacity-80"
              >
                <Text className="text-foreground font-semibold text-base">Go to Home</Text>
              </TouchableOpacity>
            </View>

            {/* Support Info */}
            <Text className="text-xs text-muted text-center mt-6">
              If this problem continues, please contact support
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary using Error Boundary component
 * Can be used with functional components
 */
export function useErrorHandler(error: Error | null) {
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, reset: () => void) => ReactNode,
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
