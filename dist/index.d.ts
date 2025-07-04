export interface CSVBoxOptions {
    language?: string;
    [key: string]: any;
}
export interface CSVBoxConfiguration {
    lazy?: boolean;
    data_location?: string;
    customDomain?: string;
    debug?: boolean;
    libraryVersion?: string;
    framework?: string;
    environment?: Record<string, any>;
    theme?: string;
    [key: string]: any;
}
export interface CSVBoxEventData {
    type?: string;
    data?: any;
    column_mapping?: any;
    ignored_column_row?: any;
    unique_token?: string;
    row_data?: any[];
    headers?: string[];
    dynamicColumnsIndexes?: number[];
    virtualColumnsIndexes?: number[];
    raw_columns?: string[];
}
export type CallbackFn = ((success: boolean, data?: any) => void) | null;
export type ListenerCallback = (data?: any) => void;
declare class CSVBoxImporter {
    configuration: CSVBoxConfiguration;
    isIframeLoaded: boolean;
    shouldOpenModalonIframeLoad: boolean;
    slug: string;
    data: Record<string, any>;
    key: string;
    columns: any[];
    options: CSVBoxOptions;
    data_location?: string;
    callback: CallbackFn;
    onReady?: ListenerCallback;
    onClose?: ListenerCallback;
    onSubmit?: ListenerCallback;
    onLoadStart?: ListenerCallback;
    iframe?: HTMLIFrameElement;
    holder?: HTMLElement;
    id?: string;
    isModalShown: boolean;
    constructor(slug: string, data?: Record<string, any>, callback?: CallbackFn, configuration?: CSVBoxConfiguration);
    initImporter(): void;
    setUpImporter(): void;
    setUser(data: Record<string, any>): void;
    listen(type: string, callback?: ListenerCallback | null): void;
    setupMessageListener(): void;
    openModal(): void;
    randomString(): string;
    setDynamicColumns(columns: any[]): void;
    setOptions(options: CSVBoxOptions): void;
    log(message: string): void;
    setCallback(callback: CallbackFn): void;
}
export default CSVBoxImporter;
