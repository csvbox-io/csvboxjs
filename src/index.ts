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

class CSVBoxImporter {
    
    configuration: CSVBoxConfiguration;
    isIframeLoaded: boolean = false;
    shouldOpenModalonIframeLoad: boolean = false;
    slug: string;
    data: Record<string, any>;
    key: string;
    columns: any[] = [];
    options: CSVBoxOptions = {};
    data_location?: string;
    callback: CallbackFn = null;
    onReady?: ListenerCallback;
    onClose?: ListenerCallback;
    onSubmit?: ListenerCallback;
    onLoadStart?: ListenerCallback;
    iframe?: HTMLIFrameElement;
    holder?: HTMLElement;
    id?: string;
    isModalShown: boolean = false;

    constructor(slug: string, data: Record<string, any> = {}, callback: CallbackFn = null, configuration: CSVBoxConfiguration = {}) {

        this.configuration = configuration;
        this.slug = slug;
        this.data = data;
        this.callback = callback;
        this.key = this.randomString();

        if (this.configuration.data_location) {
            this.data_location = this.configuration.data_location;
        }

        this.log("Importer initialisation started");

        if (document.readyState === "complete") {
            this.log("document readyState is complete");
            if (!this.configuration.lazy) {
                this.setUpImporter();
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            this.log("Event: DOMContentLoaded");
            if (!this.configuration.lazy) {
                this.setUpImporter();
            }
        });

        if (!this.configuration.lazy) {
            this.setUpImporter();
        }

        this.log("Importer initialisation done");

    }

    initImporter() {
        try {
            this.onLoadStart?.();

            this.log("Called setUpImporter();");

            this.isModalShown = false;
            this.isIframeLoaded = false;

            this.setupMessageListener();

            const cssText = `
                .csvbox-component {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index:2147483647;
                }
                .csvbox-component iframe {
                    height: 100%;
                    width: 100%;
                    position: absolute;
                }
            `;

            const css = document.createElement("style");
            css.type = "text/css";
            if ("textContent" in css) css.textContent = cssText;
            else (css as any).innerText = cssText;
            document.body.appendChild(css);

            this.id = "csvbox-embed-" + this.key;
            this.holder = document.createElement("div");
            this.holder.classList.add('csvbox-component');
            this.holder.style.display = "none";

            const iframe = document.createElement("iframe");
            this.iframe = iframe;

            let domain = "app.csvbox.io";
            if (this.configuration.customDomain) {
                domain = this.configuration.customDomain;
            }

            let BASE_URL = `https://${domain}/embed/`;
            if (this.data_location) {
                BASE_URL = `https://${this.data_location}-${domain}/embed/`;
            }

            let url = BASE_URL + this.slug;
            url += `?debug=${!!this.configuration?.debug}`;
            url += `&source=embedCode`;
            url += `&library-version=${this.configuration?.libraryVersion ?? '1.1.0'}`;

            if (this.configuration?.framework) {
                url += `&framework=${this.configuration.framework}`;
            }

            if (this.data_location) {
                url += `&preventRedirect`;
            }

            if (this.options.language) {
                url += `&language=${this.options.language}`;
            }

            if (this.configuration?.environment) {
                const environment = JSON.stringify(this.configuration.environment).replace(/['"]/g, '\\$&');
                url += `&env=${environment}`;
            }

            if (this.configuration?.theme) {
                url += `&theme=${this.configuration.theme}`;
            }

            this.log("Loading url " + url);

            iframe.setAttribute("src", url);
            iframe.setAttribute("data-csvbox-slug", this.slug);
            iframe.frameBorder = "0";

            this.holder.id = this.id;
            this.holder.appendChild(iframe);
            document.body.appendChild(this.holder);

            iframe.onload = () => {
                this.isIframeLoaded = true;

                if (this.shouldOpenModalonIframeLoad) {
                    this.shouldOpenModalonIframeLoad = false;
                    this.openModal();
                }

                iframe.contentWindow?.postMessage({
                    customer: this.data,
                    columns: this.columns,
                    options: this.options,
                    unique_token: this.key
                }, "*");

                this.onReady?.();

                this.log("iframe is ready.");
            };
        } catch (err) {
            this.log("Importer initialisation error " + err);
        }
    }

    setUpImporter() {
        const oldComponent = document.getElementById("csvbox-embed-" + this.key);
        if (oldComponent) {
            this.log("Old csvbox component present on page");
            const iframe = oldComponent.firstChild as HTMLIFrameElement;
            if (iframe.getAttribute("data-csvbox-slug") !== this.slug) {
                this.log("Slug has been changed, csvbox component refresh is required");
                oldComponent.remove();
                this.initImporter();
            }
        } else {
            this.initImporter();
        }
    }

    setUser(data: Record<string, any>) {
        this.data = data;
        this.iframe?.contentWindow?.postMessage({ customer: this.data }, "*");
    }

    listen(type: string, callback: ListenerCallback | null = null) {
        if (typeof callback === "function") {
            switch (type) {
                case "onReady":
                    this.onReady = callback;
                    break;
                case "onClose":
                    this.onClose = callback;
                    break;
                case "onSubmit":
                    this.onSubmit = callback;
                    break;
                case "onLoadStart":
                    this.onLoadStart = callback;
                    break;
            }
        }
    }

    setupMessageListener() {
        window.addEventListener("message", (event: MessageEvent) => {
            const data: CSVBoxEventData = event.data;

            if (typeof data == "string" && data === "mainModalHidden" || data.type === "csvbox-modal-hidden") {
                if (this.holder) this.holder.style.display = 'none';
                this.isModalShown = false;
                this.onClose?.();
            }

            if (typeof data == "string" && data === "uploadSuccessful") {
                this.callback?.(true);
            }

            if (typeof data == "string" &&  data === "uploadFailed" || data.type === "csvbox-upload-failed") {
                this.callback?.(false);
            }

            if (typeof data === "object" && data.data?.unique_token === this.key) {
                if (data.type === "data-on-submit") {
                    const metadata = data.data;
                    metadata.column_mappings = data.column_mapping;
                    metadata.ignored_columns = data.ignored_column_row;
                    delete metadata.unique_token;
                    this.onSubmit?.(metadata);
                } else if (data.type === "data-push-status") {
                    if (data.data?.import_status === "success") {
                        const metadata = data.data;
                        if (data.row_data) {
                            const rows: any[] = [];
                            const headers = data.headers || [];
                            const dynamicIndexes = data.dynamicColumnsIndexes || [];
                            const virtualIndexes = data.virtualColumnsIndexes || [];

                            for (const rowData of data.row_data) {
                                const row: any = {};
                                const dynamicData: any = {};
                                const virtualData: any = {};

                                rowData.data.forEach((col: any, i: number) => {
                                    col = col ?? "";
                                    const header = headers[i];

                                    if (dynamicIndexes.includes(i)) dynamicData[header] = col;
                                    else if (virtualIndexes.includes(i)) virtualData[header] = col;
                                    else row[header] = col;
                                });

                                if (rowData.unmapped_data) row["_unmapped_data"] = rowData.unmapped_data;
                                if (Object.keys(dynamicData).length) row["_dynamic_data"] = dynamicData;
                                if (Object.keys(virtualData).length) row["_virtual_data"] = virtualData;

                                rows.push(row);
                            }

                            metadata.rows = rows;
                            metadata.column_mappings = data.column_mapping;
                            metadata.raw_columns = data.raw_columns;
                            metadata.ignored_columns = data.ignored_column_row;
                            delete metadata.unique_token;

                            this.callback?.(true, metadata);
                        } else {
                            delete metadata.unique_token;
                            this.callback?.(true, metadata);
                        }
                    } else {
                        const metadata = data.data;
                        delete metadata.unique_token;
                        this.callback?.(false, metadata);
                    }
                }
            }
        }, false);

        this.log("Message listener initialised.");
    }

    openModal() {
        if (this.configuration.lazy) {
            this.setUpImporter();
        }

        if (this.isIframeLoaded) {
            if (!this.isModalShown) {
                this.isModalShown = true;
                this.iframe?.contentWindow?.postMessage('openModal', '*');
                if (this.holder) this.holder.style.display = 'block';
            }
        } else {
            this.shouldOpenModalonIframeLoad = true;
            this.log("iframe not loaded yet. Modal will open once iframe is loaded");
        }
    }

    randomString(): string {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 15 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    }

    setDynamicColumns(columns: any[]) {
        this.columns = columns;
        this.iframe?.contentWindow?.postMessage({ columns: this.columns }, "*");
    }

    setOptions(options: CSVBoxOptions) {
        this.options = options;
        this.iframe?.contentWindow?.postMessage({ options: this.options }, "*");
    }

    log(message: string) {
        if (this.configuration.debug || sessionStorage?.getItem('CSVBOX_DEBUG_FLAG') === "true") {
            console.log("[CSVBox]", message);
        }
    }

    setCallback(callback: CallbackFn) {
        this.callback = callback;
    }

}

if(typeof document !== 'undefined') {
    const csvboxElements = document.querySelectorAll("[data-csvbox]");
    if (csvboxElements.length > 0) {
        window.addEventListener('load', () => {
            csvboxElements.forEach(element => {
                (element as HTMLButtonElement).disabled = false;
            });
        });
    }
}


export default CSVBoxImporter;
