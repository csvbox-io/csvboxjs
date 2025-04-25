class CSVBoxImporter {

    constructor(slug, data = {}, callback = null, configuration = {}) {

        this.configuration = configuration;

        this.log("Importer initialisation started");

        this.isIframeLoaded = false;
        this.shouldOpenModalonIframeLoad = false;
        this.slug = slug;
        this.data = data;

        this.key = this.randomString();

        this.columns = [];
        this.options = [];

        if(!!this.configuration.data_location) {
            this.data_location = this.configuration.data_location;
        }

        if (callback && (typeof callback == "function")) {
            this.callback = callback;
        }

        let self = this;

        if(document.readyState === "complete") {
            self.log("document readyState is complete");
            if(!self.configuration.lazy) {
                self.setUpImporter();
            }
        }

        this.log("Setting up DOMContentLoaded event listener " + document.readyState);

        document.addEventListener('DOMContentLoaded', function() {
            self.log("Event: DOMContentLoaded");
            if(!self.configuration.lazy) {
                self.setUpImporter();
            }
        });

        if(!this.configuration.lazy) {
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

            let cssText = "" +
                ".csvbox-component {" +
                    "position: fixed;" +
                    "top: 0;" +
                    "bottom: 0;" +
                    "left: 0;" +
                    "right: 0;" +
                    "z-index:2147483647;" +
                "}" +
                ".csvbox-component iframe{" +
                    "height: 100%;" +
                    "width: 100%;" +
                    "position: absolute;" +
                "}";

            let css = document.createElement("style");
            css.type = "text/css";

            if (!!this.configuration.nonce) {
                css.nonce = this.configuration.nonce;
            }

            if ("textContent" in css)
                css.textContent = cssText;
            else
                css.innerText = cssText;
            document.body.appendChild(css);

            this.id = "csvbox-embed-" + this.key;
            this.holder = document.createElement("div");
            this.holder.classList.add('csvbox-component');
            this.holder.style.display = "none";

            let iframe = document.createElement("iframe");
            this.iframe = iframe;

            let domain = "app.csvbox.io";

            if(!!this.configuration.customDomain) {
                domain = this.configuration.customDomain;
            }

            let BASE_URL = `https://${domain}/embed/`;

            if(this.data_location) {
                BASE_URL = `https://${this.data_location}-${domain}/embed/`;
            }

            let url = BASE_URL + this.slug;
            url += `?debug=${!!this.configuration?.debug}`;
            url += `&source=embedCode`;
            url += `&library-version=${ this.configuration?.libraryVersion ? this.configuration?.libraryVersion : '1.1.0'}`;

            if(this.configuration?.framework) {
                url += `&framework=${this.configuration.framework}`;
            }

            if(this.data_location) {
                url += `&preventRedirect`;
            }

            if(this.options.language) {
                url += `&language=${this.options.language}`;
            }

            if(this.configuration?.environment) {
                let environment = JSON.stringify(this.configuration.environment).replace(/['"]/g, function(match) {
                    return '\\' + match;
                });
                url += `&env=${environment}`;
            }

            this.log("Loading url " + url);

            iframe.setAttribute("src", url);

            iframe.setAttribute("data-csvbox-slug", this.slug);            

            iframe.frameBorder = 0;
            this.holder.id = this.id;
            this.holder.appendChild(iframe);
            document.body.appendChild(this.holder);

            let self = this;

            iframe.onload = function () {

                self.isIframeLoaded = true;

                if(self.shouldOpenModalonIframeLoad) {
                    self.shouldOpenModalonIframeLoad = false;
                    self.openModal();
                }

                iframe.contentWindow.postMessage({
                    "customer" : self.data,
                    "columns" : self.columns,
                    "options" : self.options,
                    "unique_token": self.key
                }, "*");

                self.onReady?.();

                self.log("iframe is ready.");

            }

            // this.isImporterInitialised = true;
        } catch(err) {
            this.log("Importer initialisation error " + err);
            // this.isImporterInitialised = false;
        }
    }


    setUpImporter() {

        let oldComponent = document.getElementById("csvbox-embed-" + this.key);

        if(oldComponent) {
            
            this.log("Old csvbox component present on page");

            let iframe = oldComponent.firstChild;
            if(iframe.getAttribute("data-csvbox-slug") !== this.slug) {
                this.log("Slug has been changed, csvbox component refresh is required");
                oldComponent.remove();
                this.initImporter();
            }
            
        }else{
            this.initImporter();
        }

        
    }

    setUser(data) {
        this.data = data;
        if(this.iframe) {
            this.iframe.contentWindow.postMessage({
                "customer" : this.data
            }, "*");
        }
    }

    listen(type, callback = null) {
        if(typeof callback == "function") {
            switch(type){
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
        
        window.addEventListener("message", (event) => {

            if (event.data === "mainModalHidden") {
                this.holder.style.display = 'none';
                this.isModalShown = false;
                this.onClose?.();
            }
            if(event.data === "uploadSuccessful") {
                if(this.callback && (typeof this.callback == "function")){
                    this.callback(true);
                }
            }
            if(event.data === "uploadFailed") {
                if(this.callback && (typeof this.callback == "function")){
                    this.callback(false);
                }
            }
            if(typeof event.data == "object") {
                if(event?.data?.data?.unique_token == this.key) {
                if(event.data.type && event.data.type == "data-on-submit") {
                    let metadata = event.data.data;
                    metadata["column_mappings"] = event.data.column_mapping;
                    metadata["ignored_columns"] = event.data.ignored_column_row;
                    delete metadata["unique_token"];
                    this.onSubmit?.(metadata);
                }
                else if(event.data.type && event.data.type == "data-push-status") {
                    if(event.data.data.import_status == "success") {
                        
                        if(event?.data?.row_data) {
                            
                            let primary_row_data = event.data.row_data;
                            let headers = event.data.headers;
                            let rows = [];
                            let dynamic_columns_indexes = event.data.dynamicColumnsIndexes;
                            let virtual_columns_indexes = event.data.virtualColumnsIndexes || [];

                            primary_row_data.forEach((row_data) => {
                                
                                let x = {};
                                let dynamic_columns = {};
                                let virtual_data = {};

                                row_data.data.forEach((col, i)=>{
                                    if(col == undefined){ col = ""};
                                    if(dynamic_columns_indexes.includes(i)) {
                                        dynamic_columns[headers[i]] = col;
                                    }
                                    else if(virtual_columns_indexes.includes(i)) {
                                        virtual_data[headers[i]] = col;
                                    }
                                    else{
                                        x[headers[i]] = col;
                                    }
                                });

                                if(row_data?.unmapped_data) {
                                    x["_unmapped_data"] = row_data.unmapped_data;
                                }
                                if(dynamic_columns && Object.keys(dynamic_columns).length > 0) {
                                    x["_dynamic_data"] = dynamic_columns;
                                }
                                if(virtual_data && Object.keys(virtual_data).length > 0) {
                                    x["_virtual_data"] = virtual_data;
                                }
                                
                                rows.push(x);

                            });
                            let metadata = event.data.data;
                            metadata["rows"] = rows;
                            metadata["column_mappings"] = event.data.column_mapping;
                            metadata["raw_columns"] = event.data.raw_columns;
                            metadata["ignored_columns"] = event.data.ignored_column_row;
                            delete metadata["unique_token"];
                            this.callback(true, metadata);
                        }else{
                            let metadata = event.data.data;
                            delete metadata["unique_token"];
                            this.callback(true, metadata);
                        }
                    }else {
                        let metadata = event.data.data;
                        delete metadata["unique_token"];
                        this.callback(false, metadata);
                        }
                        
                    }else if (event.data.type && event.data.type == "csvbox-upload-failed") {
                        this.callback(false);
                    }else if(event.data.type && event.data.type == "csvbox-modal-hidden") {
                        this.holder.style.display = 'none';
                        this.isModalShown = false;
                        this.onClose?.();
                    }
                        
                }

            }
        }, false);

        this.log("Message listener initialised.");

    }

    openModal() {
        if(!!this.configuration.lazy) {
            this.setUpImporter();
        }
        if(this.isIframeLoaded) {
            if(!this.isModalShown) {
                this.isModalShown = true;
                this.holder.querySelector('iframe').contentWindow.postMessage('openModal', '*');
                this.holder.style.display = 'block';
            }
        } else {
            this.shouldOpenModalonIframeLoad = true;
            this.log("iframe not loaded yet. Modal will open once iframe is loaded");
        }
    }

    randomString() {
        let result = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < 15; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    setDynamicColumns(columns) {
        this.columns = columns;
        if(this.iframe) {
            this.iframe.contentWindow.postMessage({
                "columns" : this.columns
            }, "*");
        }
    }

    setOptions(options) {
        this.options = options;
        if(this.iframe) {
            this.iframe.contentWindow.postMessage({
                "options" : this.options
            }, "*");
        }
    }

    log(message) {
        if(!!this.configuration.debug || (sessionStorage && sessionStorage.getItem('CSVBOX_DEBUG_FLAG') == "true" )) {
            console.log("[CSVBox]", message);    
        }
    }

}

let csvboxElements = document.querySelectorAll("[data-csvbox]");
if(csvboxElements.length > 0){
    window.addEventListener('load', () => {
        csvboxElements.forEach(element => {
            element.disabled = false;
        });
    });
}

export default CSVBoxImporter;
