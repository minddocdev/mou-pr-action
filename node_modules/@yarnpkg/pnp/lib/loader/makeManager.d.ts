/// <reference types="node" />
/// <reference types="node" />
import { FakeFS, NativePath, PortablePath } from '@yarnpkg/fslib';
import fs from 'fs';
import { PnpApi } from '../types';
export type ApiMetadata = {
    instance: PnpApi;
    stats: fs.Stats;
    lastRefreshCheck: number;
};
export type MakeManagerOptions = {
    fakeFs: FakeFS<PortablePath>;
};
export type Manager = ReturnType<typeof makeManager>;
export declare function makeManager(pnpapi: PnpApi, opts: MakeManagerOptions): {
    getApiPathFromParent: (parent: NodeModule | null | undefined) => PortablePath | null;
    findApiPathFor: (modulePath: NativePath) => PortablePath | null;
    getApiEntry: (pnpApiPath: PortablePath, refresh?: boolean) => ApiMetadata;
};
