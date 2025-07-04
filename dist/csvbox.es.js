var M = Object.defineProperty;
var S = (n, e, t) => e in n ? M(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var i = (n, e, t) => S(n, typeof e != "symbol" ? e + "" : e, t);
class C {
  constructor(e, t = {}, s = null, r = {}) {
    i(this, "configuration");
    i(this, "isIframeLoaded", !1);
    i(this, "shouldOpenModalonIframeLoad", !1);
    i(this, "slug");
    i(this, "data");
    i(this, "key");
    i(this, "columns", []);
    i(this, "options", {});
    i(this, "data_location");
    i(this, "callback", null);
    i(this, "onReady");
    i(this, "onClose");
    i(this, "onSubmit");
    i(this, "onLoadStart");
    i(this, "iframe");
    i(this, "holder");
    i(this, "id");
    i(this, "isModalShown", !1);
    this.configuration = r, this.slug = e, this.data = t, this.callback = s, this.key = this.randomString(), this.configuration.data_location && (this.data_location = this.configuration.data_location), this.log("Importer initialisation started"), document.readyState === "complete" && (this.log("document readyState is complete"), this.configuration.lazy || this.setUpImporter()), document.addEventListener("DOMContentLoaded", () => {
      this.log("Event: DOMContentLoaded"), this.configuration.lazy || this.setUpImporter();
    }), this.configuration.lazy || this.setUpImporter(), this.log("Importer initialisation done");
  }
  initImporter() {
    var e, t, s, r, u, m;
    try {
      (e = this.onLoadStart) == null || e.call(this), this.log("Called setUpImporter();"), this.isModalShown = !1, this.isIframeLoaded = !1, this.setupMessageListener();
      const l = `
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
            `, d = document.createElement("style");
      d.type = "text/css", "textContent" in d ? d.textContent = l : d.innerText = l, document.body.appendChild(d), this.id = "csvbox-embed-" + this.key, this.holder = document.createElement("div"), this.holder.classList.add("csvbox-component"), this.holder.style.display = "none";
      const a = document.createElement("iframe");
      this.iframe = a;
      let c = "app.csvbox.io";
      this.configuration.customDomain && (c = this.configuration.customDomain);
      let f = `https://${c}/embed/`;
      this.data_location && (f = `https://${this.data_location}-${c}/embed/`);
      let o = f + this.slug;
      if (o += `?debug=${!!((t = this.configuration) != null && t.debug)}`, o += "&source=embedCode", o += `&library-version=${((s = this.configuration) == null ? void 0 : s.libraryVersion) ?? "1.1.0"}`, (r = this.configuration) != null && r.framework && (o += `&framework=${this.configuration.framework}`), this.data_location && (o += "&preventRedirect"), this.options.language && (o += `&language=${this.options.language}`), (u = this.configuration) != null && u.environment) {
        const h = JSON.stringify(this.configuration.environment).replace(/['"]/g, "\\$&");
        o += `&env=${h}`;
      }
      (m = this.configuration) != null && m.theme && (o += `&theme=${this.configuration.theme}`), this.log("Loading url " + o), a.setAttribute("src", o), a.setAttribute("data-csvbox-slug", this.slug), a.frameBorder = "0", this.holder.id = this.id, this.holder.appendChild(a), document.body.appendChild(this.holder), a.onload = () => {
        var h, y;
        this.isIframeLoaded = !0, this.shouldOpenModalonIframeLoad && (this.shouldOpenModalonIframeLoad = !1, this.openModal()), (h = a.contentWindow) == null || h.postMessage({
          customer: this.data,
          columns: this.columns,
          options: this.options,
          unique_token: this.key
        }, "*"), (y = this.onReady) == null || y.call(this), this.log("iframe is ready.");
      };
    } catch (l) {
      this.log("Importer initialisation error " + l);
    }
  }
  setUpImporter() {
    const e = document.getElementById("csvbox-embed-" + this.key);
    e ? (this.log("Old csvbox component present on page"), e.firstChild.getAttribute("data-csvbox-slug") !== this.slug && (this.log("Slug has been changed, csvbox component refresh is required"), e.remove(), this.initImporter())) : this.initImporter();
  }
  setUser(e) {
    var t, s;
    this.data = e, (s = (t = this.iframe) == null ? void 0 : t.contentWindow) == null || s.postMessage({ customer: this.data }, "*");
  }
  listen(e, t = null) {
    if (typeof t == "function")
      switch (e) {
        case "onReady":
          this.onReady = t;
          break;
        case "onClose":
          this.onClose = t;
          break;
        case "onSubmit":
          this.onSubmit = t;
          break;
        case "onLoadStart":
          this.onLoadStart = t;
          break;
      }
  }
  setupMessageListener() {
    window.addEventListener("message", (e) => {
      var s, r, u, m, l, d, a, c, f;
      const t = e.data;
      if ((typeof t == "string" && t === "mainModalHidden" || t.type === "csvbox-modal-hidden") && (this.holder && (this.holder.style.display = "none"), this.isModalShown = !1, (s = this.onClose) == null || s.call(this)), typeof t == "string" && t === "uploadSuccessful" && ((r = this.callback) == null || r.call(this, !0)), (typeof t == "string" && t === "uploadFailed" || t.type === "csvbox-upload-failed") && ((u = this.callback) == null || u.call(this, !1)), typeof t == "object" && ((m = t.data) == null ? void 0 : m.unique_token) === this.key) {
        if (t.type === "data-on-submit") {
          const o = t.data;
          o.column_mappings = t.column_mapping, o.ignored_columns = t.ignored_column_row, delete o.unique_token, (l = this.onSubmit) == null || l.call(this, o);
        } else if (t.type === "data-push-status")
          if (((d = t.data) == null ? void 0 : d.import_status) === "success") {
            const o = t.data;
            if (t.row_data) {
              const h = [], y = t.headers || [], k = t.dynamicColumnsIndexes || [], I = t.virtualColumnsIndexes || [];
              for (const b of t.row_data) {
                const p = {}, _ = {}, v = {};
                b.data.forEach((g, w) => {
                  g = g ?? "";
                  const x = y[w];
                  k.includes(w) ? _[x] = g : I.includes(w) ? v[x] = g : p[x] = g;
                }), b.unmapped_data && (p._unmapped_data = b.unmapped_data), Object.keys(_).length && (p._dynamic_data = _), Object.keys(v).length && (p._virtual_data = v), h.push(p);
              }
              o.rows = h, o.column_mappings = t.column_mapping, o.raw_columns = t.raw_columns, o.ignored_columns = t.ignored_column_row, delete o.unique_token, (a = this.callback) == null || a.call(this, !0, o);
            } else
              delete o.unique_token, (c = this.callback) == null || c.call(this, !0, o);
          } else {
            const o = t.data;
            delete o.unique_token, (f = this.callback) == null || f.call(this, !1, o);
          }
      }
    }, !1), this.log("Message listener initialised.");
  }
  openModal() {
    var e, t;
    this.configuration.lazy && this.setUpImporter(), this.isIframeLoaded ? this.isModalShown || (this.isModalShown = !0, (t = (e = this.iframe) == null ? void 0 : e.contentWindow) == null || t.postMessage("openModal", "*"), this.holder && (this.holder.style.display = "block")) : (this.shouldOpenModalonIframeLoad = !0, this.log("iframe not loaded yet. Modal will open once iframe is loaded"));
  }
  randomString() {
    const e = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 15 }, () => e.charAt(Math.floor(Math.random() * e.length))).join("");
  }
  setDynamicColumns(e) {
    var t, s;
    this.columns = e, (s = (t = this.iframe) == null ? void 0 : t.contentWindow) == null || s.postMessage({ columns: this.columns }, "*");
  }
  setOptions(e) {
    var t, s;
    this.options = e, (s = (t = this.iframe) == null ? void 0 : t.contentWindow) == null || s.postMessage({ options: this.options }, "*");
  }
  log(e) {
    (this.configuration.debug || (sessionStorage == null ? void 0 : sessionStorage.getItem("CSVBOX_DEBUG_FLAG")) === "true") && console.log("[CSVBox]", e);
  }
  setCallback(e) {
    this.callback = e;
  }
}
if (typeof document < "u") {
  const n = document.querySelectorAll("[data-csvbox]");
  n.length > 0 && window.addEventListener("load", () => {
    n.forEach((e) => {
      e.disabled = !1;
    });
  });
}
export {
  C as default
};
