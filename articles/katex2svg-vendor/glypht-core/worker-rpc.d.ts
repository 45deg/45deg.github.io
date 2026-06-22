import { AxisInfo, FeatureInfo, NamedInstance, SfntVersion, StyleAttributes, StyleValues, SubsetInfo, SubsetSettings, SubsettedFont } from './font-types.js';
export type MessageSchema = {
    readonly request: {
        readonly name: string;
        readonly message: unknown;
    };
    readonly response: {
        readonly name: string;
        readonly message: unknown;
    };
};
export type RpcSchema = MessageSchema[];
export type FontMessage = {
    id: number;
    uid: string;
    faceCount: number;
    faceIndex: number;
    familyName: string;
    subfamilyName: string;
    styleValues: StyleValues;
    styleAttributes: StyleAttributes;
    fileSize: number;
    axes: AxisInfo[];
    features: FeatureInfo[];
    namedInstances: NamedInstance[];
    subsetCoverage: SubsetInfo[];
    unicodeRanges: (number | readonly [number, number])[];
};
export type FontWorkerSchema = {
    request: {
        name: 'update-fonts';
        message: {
            loadFonts: Uint8Array[];
            unloadFonts: number[];
        };
    };
    response: {
        name: 'updated-fonts';
        message: {
            fonts: FontMessage[];
        };
    };
} | {
    request: {
        name: 'subset-font';
        message: {
            font: number;
            settings: SubsetSettings;
        };
    };
    response: {
        name: 'subsetted-font';
        message: SubsettedFont;
    };
} | {
    request: {
        name: 'get-font-data';
        message: number;
    };
    response: {
        name: 'got-font-data';
        message: {
            data: Uint8Array<ArrayBuffer>;
            format: SfntVersion;
        };
    };
} | {
    request: {
        name: 'get-font-file-data';
        message: number;
    };
    response: {
        name: 'got-font-file-data';
        message: Uint8Array<ArrayBuffer>;
    };
} | {
    request: {
        name: 'get-font-file-hash';
        message: number;
    };
    response: {
        name: 'got-font-file-hash';
        message: string;
    };
};
export type CompressionWorkerSchema = {
    request: {
        name: 'init-woff-wasm';
        message: {
            woff1: Uint8Array<ArrayBuffer> | string;
            woff2: Uint8Array<ArrayBuffer> | string;
        };
    };
    response: never;
} | {
    request: {
        name: 'compress-font';
        message: {
            data: Uint8Array;
            algorithm: 'woff' | 'woff2';
            quality: number;
        };
    };
    response: {
        name: 'compressed-font';
        message: Uint8Array<ArrayBuffer>;
    };
} | {
    request: {
        name: 'decompress-font';
        message: {
            data: Uint8Array;
            algorithm: 'woff' | 'woff2';
        };
    };
    response: {
        name: 'decompressed-font';
        message: Uint8Array<ArrayBuffer>;
    };
};
type ReqRespMap<T extends MessageSchema> = {
    [M in T as M['response']['name'] extends never ? never : M['request']['name']]: M['response']['name'];
};
export type MessageToWorker<T extends MessageSchema> = (T extends unknown ? {
    type: T['request']['name'];
    message: T['request']['message'];
    id: number;
} : never) | {
    type: 'close';
    message: null;
    id: number;
};
export type MessageFromWorker<T extends MessageSchema> = (T extends unknown ? {
    type: T['response']['name'];
    message: T['response']['message'];
    originId: number;
} : never) | {
    type: 'error';
    message: unknown;
    originId: number;
};
export default class RpcDispatcher<T extends MessageSchema> {
    private worker;
    private map;
    private sentMessageId;
    /**
     * Number of messages we're waiting for the worker to respond to. If greater than 0, we will avoid terminating the
     * worker until this hits 0.
     *
     * Terminating a web worker *should* be straightforward--we just tell it to remove any event listeners on its side,
     * all event loops are done, and the process can exit. Unfortunately, there is either a bug in
     * https://github.com/valadaptive/web-worker or Node that causes the event loop to stay alive forever if too many
     * compression threads are created under certain timing conditions. So, we need to manually refcount the number of
     * messages we're waiting on.
     */
    private inflightRequests;
    /**
     * True if we're waiting to terminate the worker.
     */
    private deferClose;
    constructor(worker: Worker, map: ReqRespMap<T>);
    send<Name extends T['request']['name'], Message extends Extract<T, {
        request: {
            name: Name;
        };
    }>['request']['message']>(name: Name, message: Message, transfer?: Transferable[]): Promise<Extract<T, {
        request: {
            name: Name;
        };
    }>['response']['message']>;
    sendAndForget<Name extends string, Message extends Extract<T, {
        request: {
            name: Name;
        };
    }>['request']['message']>(name: Name, message: Message, transfer?: Transferable[]): void;
    close(): void;
}
export declare const postMessageFromWorker: <T extends MessageSchema>(message: MessageFromWorker<T>, transfer?: Transferable[]) => void;
export {};
//# sourceMappingURL=worker-rpc.d.ts.map