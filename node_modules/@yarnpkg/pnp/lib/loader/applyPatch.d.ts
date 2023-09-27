import { FakeFS, PortablePath } from '@yarnpkg/fslib';
import { PnpApi } from '../types';
import { Manager } from './makeManager';
export type ApplyPatchOptions = {
    fakeFs: FakeFS<PortablePath>;
    manager: Manager;
};
declare global {
    namespace NodeJS {
        interface Process {
            dlopen: (module: Object, filename: string, flags?: number) => void;
        }
    }
}
export declare function applyPatch(pnpapi: PnpApi, opts: ApplyPatchOptions): void;
