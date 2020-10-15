import * as Sentry from '@sentry/browser';
import { NextAppMiddleware } from '../../src';

const SentryErrorLoggingMiddleware: NextAppMiddleware = {
    id: 'sentry',
    componentDidCatch: (error, errorInfo) => {
        Sentry.configureScope(scope => {
            Object.keys(errorInfo).forEach(key => {
                scope.setExtra(key, errorInfo[key]);
            });
        });
        Sentry.captureException(error);
    }
};

export default SentryErrorLoggingMiddleware;