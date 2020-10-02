const helpers = allMiddleware => {
    const uniqAllMiddleware = allMiddleware.map(middleware => ({
        ...middleware
    }));

    const extractMiddleware = key =>
        uniqAllMiddleware
            .filter(middleware => !!middleware[key])
            .map(middleware => ({
                middleware: middleware[key],
                id: middleware.id
            }));

    const executeMiddleware = async (key, ...args) => {
        const currentMiddleware = extractMiddleware(key);
        const result = {};
        for (let i = 0; i < currentMiddleware.length; i += 1) {
            const { middleware, id } = currentMiddleware[i];
            // each loop iteration is delayed until the entire asynchronous operation completes
            result[id] = (await middleware(...args)) || {}; // eslint-disable-line
        }
        return result;
    };

    const executeMiddlewareSync = (key, ...args) =>
        extractMiddleware(key)
            .map(({ middleware, id }) => ({
                result: middleware(...args),
                id
            }))
            .reduce(
                (result, { id, result: middlewareResult }) => ({
                    ...result,
                    [id]: middlewareResult
                }),
                {}
            );

    return {
        extractMiddleware,
        executeMiddleware,
        executeMiddlewareSync
    };
};

export default helpers;
