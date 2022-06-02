class CSVBoxImporter {

    constructor(slug, data = {}, callback = null, configuration = {}) {

        this.isIframeLoaded = false;
        this.shouldOpenModalonIframeLoad = false;
        this.slug = slug;
        this.data = data;

        this.columns = [];
        this.options = [];

        this.configuration = configuration;

        if (callback && (typeof callback == "function")) {
            this.callback = callback;
        }

        let self = this;

        if(document.readyState === "complete") {
            self.setUpImporter();
        }

        document.addEventListener('DOMContentLoaded', function() {
            self.setUpImporter();
        });
    }

    setUpImporter() {

        this.isModalShown = false;

        document.addEventListener('DOMContentLoaded', function() {
            setUpImporter();
        });

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
        if ("textContent" in css)
            css.textContent = cssText;
        else
            css.innerText = cssText;
        document.body.appendChild(css);

        this.id = "csvbox-embed-" + this.randomString();
        this.holder = document.createElement("div");
        this.holder.classList.add('csvbox-component');
        this.holder.style.display = "none";

        let iframe = document.createElement("iframe");
        this.iframe = iframe;

        let BASE_URL = "https://app.csvbox.io/embed/";

        let url = BASE_URL + this.slug;
        url += `?debug=${!!this.configuration?.debug}`;
        url += `&source=embedCode`;

        iframe.setAttribute("src", url);

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
                "customer" : self.data
            }, "*");

            iframe.contentWindow.postMessage({
                "columns" : self.columns
            }, "*");

            iframe.contentWindow.postMessage({
                "options" : self.options
            }, "*");

            self.onReady?.();
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
                if(event.data.type && event.data.type == "data-push-status") {
                    if(event.data.data.import_status == "success") {
                        // this.callback(true, event.data.data);
                        if(event?.data?.row_data) {
                            
                            let primary_row_data = event.data.row_data;
                            let headers = event.data.headers;
                            let rows = [];
                            let dynamic_columns_indexes = event.data.dynamicColumnsIndexes;
                            let dropdown_display_labels_mappings = event.data.dropdown_display_labels_mappings;

                            primary_row_data.forEach((row_data) => {
                                let x = {};
                                let dynamic_columns = {};
                                row_data.data.forEach((col, i)=>{
                                    if(col == undefined){ col = ""};
                                    if(!!dropdown_display_labels_mappings[i] && !!dropdown_display_labels_mappings[i][col]) {
                                        col = dropdown_display_labels_mappings[i][col];
                                    }
                                    if(dynamic_columns_indexes.includes(i)) {
                                        dynamic_columns[headers[i]] = col;
                                    }else{
                                        x[headers[i]] = col;
                                    }
                                });
                                if(row_data?.unmapped_data) {
                                    x["_unmapped_data"] = row_data.unmapped_data;
                                }
                                if(dynamic_columns && Object.keys(dynamic_columns).length > 0) {
                                    x["_dynamic_data"] = dynamic_columns;
                                }
                                rows.push(x);
                            });
                            let metadata = event.data.data;
                            metadata["rows"] = rows;
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
                }
            }
        }, false);
    }

    openModal() {
        if(this.isIframeLoaded) {
            if(!this.isModalShown) {
                this.isModalShown = true;
                this.holder.querySelector('iframe').contentWindow.postMessage('openModal', '*');
                this.holder.style.display = 'block';
            }
        }else{
            this.shouldOpenModalonIframeLoad = true;
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

}

if(document.querySelector("[data-csvbox]") != null){
    document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
            document.querySelector("[data-csvbox]").disabled = false;
        }else{
            document.querySelector("[data-csvbox]").disabled = true;
        }
    };
}

export default CSVBoxImporter;