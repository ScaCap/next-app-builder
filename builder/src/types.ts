import { ErrorInfo, FunctionComponent } from 'react';
import { AppContext } from 'next/dist/pages/_app';

export enum MiddlewareFunctionName {
    Component = 'Component',
    componentDidCatch = 'componentDidCatch',
    getInitialProps = 'getInitialProps'
}

export type NextAppMiddleware<T = {}> = {
    id: string;

    [MiddlewareFunctionName.getInitialProps]?(appContext: AppContext): T | Promise<T>;

    [MiddlewareFunctionName.Component]?: FunctionComponent<T>;
    /**
     * Catches exceptions generated in descendant components. Unhandled exceptions will cause
     * the entire component tree to unmount.
     */
    [MiddlewareFunctionName.componentDidCatch]?(error: Error, errorInfo: ErrorInfo): void;
};
