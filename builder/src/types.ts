import { ErrorInfo, FunctionComponent } from 'react';
import { AppContext } from 'next/dist/pages/_app';
import { AppProps } from 'next/app';

export enum MiddlewareFunctionName {
    Component = 'Component',
    componentDidCatch = 'componentDidCatch',
    componentDidMount = 'componentDidMount',
    componentWillUnmount = 'componentWillUnmount',
    constructor = 'constructor',
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

    /**
     * Called immediately after a component is mounted. Setting state here will trigger re-rendering.
     */
    [MiddlewareFunctionName.constructor]?(props: AppProps): void;
    /**
     * Called immediately after a component is mounted. Setting state here will trigger re-rendering.
     */
    [MiddlewareFunctionName.componentDidMount]?(): void;
    /**
     * Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
     * cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.
     */
    [MiddlewareFunctionName.componentWillUnmount]?(): void;
};
