import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/theme';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary 컴포넌트
 * React 앱에서 JavaScript 에러를 캐치하고 크래시 대신 오류 화면을 표시합니다.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // 다음 렌더링에서 폴백 UI를 표시하도록 상태 업데이트
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // 에러 로깅 (프로덕션에서는 에러 리포팅 서비스에 전송 가능)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // TODO: 에러 리포팅 서비스 연동 (예: Sentry, Crashlytics)
        // ErrorReportingService.log(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // 커스텀 폴백 UI가 제공되면 사용
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 기본 에러 화면
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.emoji}>⚠️</Text>
                        <Text style={styles.title}>문제가 발생했습니다</Text>
                        <Text style={styles.message}>
                            앱에서 예기치 않은 오류가 발생했습니다.{'\n'}
                            아래 버튼을 눌러 다시 시도해주세요.
                        </Text>

                        <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                            <Text style={styles.retryButtonText}>다시 시도</Text>
                        </TouchableOpacity>

                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    retryButton: {
        backgroundColor: COLORS.gold,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorDetails: {
        marginTop: 30,
        padding: 15,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: 10,
        maxHeight: 200,
        width: '100%',
    },
    errorTitle: {
        color: '#ff6b6b',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    errorText: {
        color: '#ff8787',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    errorStack: {
        color: '#888',
        fontSize: 10,
        fontFamily: 'monospace',
        marginTop: 10,
    },
});

export default ErrorBoundary;
