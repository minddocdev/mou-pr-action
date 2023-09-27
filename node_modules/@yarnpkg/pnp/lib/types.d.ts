import { NativePath, PortablePath, Path } from '@yarnpkg/fslib';
export declare enum LinkType {
    HARD = "HARD",
    SOFT = "SOFT"
}
export type PhysicalPackageLocator = {
    name: string;
    reference: string;
};
export type TopLevelPackageLocator = {
    name: null;
    reference: null;
};
export type PackageLocator = PhysicalPackageLocator | TopLevelPackageLocator;
export type DependencyTarget = string | [string, string] | null;
export type PackageInformation<P extends Path> = {
    packageLocation: P;
    packageDependencies: Map<string, DependencyTarget>;
    packagePeers: Set<string>;
    linkType: LinkType;
    discardFromLookup: boolean;
};
export type PackageInformationData<P extends Path> = {
    packageLocation: P;
    packageDependencies: Array<[string, DependencyTarget]>;
    packagePeers?: Array<string>;
    linkType: LinkType;
    discardFromLookup?: boolean;
};
export type PackageStore = Map<string | null, PackageInformation<PortablePath>>;
export type PackageStoreData = Array<[string | null, PackageInformationData<PortablePath>]>;
export type PackageRegistry = Map<string | null, PackageStore>;
export type PackageRegistryData = Array<[string | null, PackageStoreData]>;
export type LocationLengthData = Array<number>;
export type SerializedState = {
    __info: Array<string>;
    enableTopLevelFallback: boolean;
    fallbackExclusionList: Array<[string, Array<string>]>;
    fallbackPool: Array<[string, DependencyTarget]>;
    ignorePatternData: string | null;
    packageRegistryData: PackageRegistryData;
    dependencyTreeRoots: Array<PhysicalPackageLocator>;
};
export type RuntimeState = {
    basePath: PortablePath;
    enableTopLevelFallback: boolean;
    fallbackExclusionList: Map<string, Set<string>>;
    fallbackPool: Map<string, DependencyTarget>;
    ignorePattern: RegExp | null;
    packageLocatorsByLocations: Map<PortablePath, {
        locator: PhysicalPackageLocator;
        discardFromLookup: boolean;
    }>;
    packageRegistry: PackageRegistry;
    dependencyTreeRoots: Array<PhysicalPackageLocator>;
};
export type PnpSettings = {
    enableTopLevelFallback?: boolean;
    fallbackExclusionList?: Array<PhysicalPackageLocator>;
    fallbackPool?: Map<string, DependencyTarget>;
    ignorePattern?: string | null;
    packageRegistry: PackageRegistry;
    shebang?: string | null;
    dependencyTreeRoots: Array<PhysicalPackageLocator>;
};
export type ResolveToUnqualifiedOptions = {
    considerBuiltins?: boolean;
};
export type ResolveUnqualifiedOptions = {
    extensions?: Array<string>;
    conditions?: Set<string>;
};
export type ResolveRequestOptions = ResolveToUnqualifiedOptions & ResolveUnqualifiedOptions;
export type PnpApi = {
    VERSIONS: {
        std: number;
        [key: string]: number;
    };
    topLevel: {
        name: null;
        reference: null;
    };
    getLocator: (name: string, referencish: string | [string, string]) => PhysicalPackageLocator;
    getDependencyTreeRoots: () => Array<PhysicalPackageLocator>;
    getPackageInformation: (locator: PackageLocator) => PackageInformation<NativePath> | null;
    findPackageLocator: (location: NativePath) => PhysicalPackageLocator | null;
    resolveToUnqualified: (request: string, issuer: NativePath | null, opts?: ResolveToUnqualifiedOptions) => NativePath | null;
    resolveUnqualified: (unqualified: NativePath, opts?: ResolveUnqualifiedOptions) => NativePath;
    resolveRequest: (request: string, issuer: NativePath | null, opts?: ResolveRequestOptions) => NativePath | null;
    resolveVirtual?: (p: NativePath) => NativePath | null;
    getAllLocators?: () => Array<PhysicalPackageLocator>;
};
