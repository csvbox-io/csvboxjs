class CSVBoxImporter {
            
    constructor(slug, data = {}, callback = null) {
        this.isIframeLoaded = false;
        this.shouldOpenModalonIframeLoad = false;
        this.slug = slug;
        this.data = data;
        if (callback && (typeof callback == "function")) {
            this.callback = callback;
        }
        let self= this;
        if(document.readyState === "complete") {
            console.log("document already laoded")
            self.setUpImporter();
        }else{
            console.log("document not laoded")
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
        
        iframe.setAttribute("src", "https://app.csvbox.io/embed/" + this.slug);
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

    setupMessageListener() {
        window.addEventListener("message", (event) => {
            if (event.data === "mainModalHidden") {
                this.holder.style.display = 'none';
                this.holder.querySelector('iframe').src = this.holder.querySelector('iframe').src;
                this.isModalShown = false;
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
                    if(event.data.data.import_status == "success"){
                        this.callback(true, event.data.data);
                    }else {
                        this.callback(false, event.data.data);
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

}

export default CSVBoxImporter;