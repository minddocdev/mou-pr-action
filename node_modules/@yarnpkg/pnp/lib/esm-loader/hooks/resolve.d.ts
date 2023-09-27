type ResolveContext = {
    conditions: Array<string>;
    parentURL: string | undefined;
};
export declare function resolve(originalSpecifier: string, context: ResolveContext, nextResolve: typeof resolve): Promise<{
    url: string;
    shortCircuit: boolean;
}>;
export {};
