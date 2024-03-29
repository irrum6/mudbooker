class AutoBookmarkerSettingsInterface {
    displayExampleName() {
        let prefix = val("naming_prefix");

        let suffix = val("naming_suffix");

        let year = "numeric";
        let radio = this.getRadioValue("format_year");
        if (radio.ok) {
            year = radio.value;
        }

        let month = "numeric";
        radio = this.getRadioValue("format_mon");
        if (radio.ok) {
            month = radio.value;
        }

        let day = "numeric";

        let locale = "default";
        let formatOptions = { year, month, day, hour: '2-digit', minute: '2-digit' };

        let formated = new Date().toLocaleString(locale, formatOptions).replace(/[\s.,]+/gi, "_").replace(/:/, "h");
        let title = `${formated}`
        if (Utils.isNoneEmptyString(prefix)) {
            title = `${prefix}${title}`;
        }
        if (Utils.isNoneEmptyString(suffix)) {
            title = `${title}${suffix}`;
        }
        query("#display_name_example").textContent = title;
    }
    doTheTranslation() {
        // translations,translations
        query("h1").textContent = browser.i18n.getMessage("full_settings");
        // translate title as well
        document.title = `Mudbooker:${browser.i18n.getMessage("full_settings")}`;

        query("span.inttext").textContent = browser.i18n.getMessage("select_interval");
        query("span.everytext").textContent = browser.i18n.getMessage("every");
        query("span.minutetext").textContent = browser.i18n.getMessage("minutes");
        query("button.saveinttext").textContent = browser.i18n.getMessage("save_interval");

        query("span.keeptext").textContent = browser.i18n.getMessage("keep_text");
        query("span.fortext").textContent = browser.i18n.getMessage("for_text");
        query("span.hourstext").textContent = browser.i18n.getMessage("hours");
        query("span.itemtext").textContent = browser.i18n.getMessage("items");
        query("button.savekeep").textContent = browser.i18n.getMessage("savekeep");

        query("span.naming").textContent = browser.i18n.getMessage("naming");
        query("span.prefix").textContent = browser.i18n.getMessage("prefix");
        query("span.suffix").textContent = browser.i18n.getMessage("suffix");

        query("span.yearformat").textContent = browser.i18n.getMessage("year_format");
        query("span.twodigit").textContent = browser.i18n.getMessage("2digit");
        query("span.yearnumeric").textContent = browser.i18n.getMessage("year_numeric");

        query("span.monformat").textContent = browser.i18n.getMessage("mon_format");
        query("span.monumeric").textContent = browser.i18n.getMessage("mon_numeric");
        query("span.monlong").textContent = browser.i18n.getMessage("mon_long");
        query("span.monshort").textContent = browser.i18n.getMessage("mon_short");
        query("span.example").textContent = browser.i18n.getMessage("example");
        query("button.savenaming").textContent = browser.i18n.getMessage("save_naming");

        query("span.othersettings").textContent = browser.i18n.getMessage("other_settings");
        query("span.savein").textContent = browser.i18n.getMessage("savein");
        query("button.saveothers").textContent = browser.i18n.getMessage("save");
    }

    #translate(s, text) {
        if (!Utils.isNoneEmptyString(s) || !Utils.isNoneEmptyString(s)) {
            console.warn("empty selector or empty text");
        }
        query(s).textContent = browser.i18n.getMessage(text);
    }
    /**
     * query and retrieve radio value with name provided
     * @param {String} name 
     * @returns {String}
     */
    getRadioValue(name) {
        let selector = "input[name=$name$]:checked".replace("$name$", name);
        let radio = query(selector);
        if (radio !== undefined && radio !== null) {
            let ok = true;
            let value = radio.value;
            return { ok, value };
        }
        let ok = false;
        let value = null;
        return { ok, value };
    }

    onIntervalChange(event) {
        //custom range
        let range = getbid("interval_range");
        let value = event.target.value;
        if ("c" === value) {
            range.enable();
            return;
        }

        range.disable();
    }
    /**
     * 
     * @param {*} interval 
     * @param {*} custom_interval
     */
    setIntervalValue(interval, custom_interval) {
        let range = getbid("interval_range");

        let intervals = query_all("extended-radio[name=interval]");
        for (const inter of intervals) {
            if (inter.value === interval) {
                inter.checked = true;
            }
        }
        if ("c" === interval) {
            range.enable();
            range.value = custom_interval;
            return;
        }
    }
    getIntervalValue() {
        let intervals = query_all("extended-radio[name=interval]");
        for (const inter of intervals) {
            if (inter.checked) {
                return inter.value;
            }
        }
    }
    onKeepforChange(event) {
        //custom range
        let range = getbid("keepfor_range");
        //max numbers range
        let items = getbid("keepfor_items");
        let value = event.target.value;
        if ("c" === value) {
            items.disable();
            range.enable();
            return;
        }
        if ("mx" === value) {
            range.disable();
            items.enable();
            return;
        }
        range.disable();
        items.disable();
    }
    /**
     * 
     * @param {*} keepfor 
     * @param {*} custom_keepfor 
     * @param {*} keep_items
     */
    setKeepforValue(keepfor, custom_keepfor, keep_items) {
        let range = getbid("keepfor_range");
        //max numbers range
        let items = getbid("keepfor_items");

        let keepers = query_all("extended-radio[name=keepfor]");
        for (const keep of keepers) {
            if (keep.value === keepfor) {
                keep.checked = true;
            }
        }
        if ("c" === keepfor) {
            range.enable();
            range.value = custom_keepfor;
            return;
        }
        if ("mx" === keepfor) {
            items.enable();
            items.value = keep_items;
            return;
        }
    }
    getKeepforValue() {
        let keepers = query_all("extended-radio[name=keepfor]");
        for (const keep of keepers) {
            if (keep.checked) {
                return keep.value;
            }
        }
    }

    setEvents() {
        let intervals = query_all("extended-radio[name=interval]");
        for (const inter of intervals) {
            inter[on]("xchanged", this.onIntervalChange.bind(this));
        }

        let keepers = query_all("extended-radio[name=keepfor]");
        for (const keep of keepers) {
            keep[on]("xchanged", this.onKeepforChange.bind(this));
        }

        const dxn_bound = this.displayExampleName.bind(this);
        // setup event listeners for prefix/suffix inputs
        let pfxelm = query("#naming_prefix");
        pfxelm[on]("change", dxn_bound);
        pfxelm[on]("input", dxn_bound);
        pfxelm[on]("keydown", dxn_bound);

        let sfxelm = query("#naming_suffix");
        sfxelm[on]("change", dxn_bound);
        sfxelm[on]("input", dxn_bound);
        sfxelm[on]("keydown", dxn_bound);

        // setup event listeners for date format inputs
        // try generic query
        let fy = query_all("[name=format_year]");
        let fm = query_all("[name=format_mon]");
        let fullSet = new Set([...fy, ...fm]);

        for (const elem of fullSet) {
            elem[on]("click", dxn_bound);
            elem[on]("focus", dxn_bound);
            elem[on]("change", dxn_bound);
            elem[on]("input", dxn_bound);
        }
    }
}
class AutoBookmarkerSettings {
    constructor() {
        this.data = this.setDefaultData();
        this.interface = new AutoBookmarkerSettingsInterface();
    }
    setDefaultData() {
        let data = Object.create(null);
        data.interval = "";
        data.keepfor = "";
        let naming = Object.create(null);
        naming.prefix = "";
        naming.suffix = "";
        naming.enableSuffix = false;
        naming.fmtyear = "numeric";
        naming.fmtMonth = "numeric";
        naming.fmtDay = "numeric";
        let other = Object.create(null);
        other.folderName = "";
        data.naming = naming;
        data.other = other;
        return data;
    }

    async loadData() {
        await this.loadInterval();
        await this.loadKeepfor();
        await this.loadNaming();
        await this.loadOtherSettings();
        this.translation();
    }

    async loadInterval() {
        let data = await browser.storage.local.get(["interval", "custom_interval"]);
        if (undefined === data || null === data) {
            return;
        }
        const { interval, custom_interval } = data;
        if (interval === undefined) {
            return;
        }
        this.interface.setIntervalValue(interval, custom_interval);
    }
    async loadKeepfor() {
        let data = await browser.storage.local.get(["keepfor", "custom_keepfor", "keep_items"]);
        if (undefined === data || null === data) {
            return;
        }
        const { keepfor, custom_keepfor, keep_items } = data;
        if (keepfor === undefined) {
            return;
        }
        this.interface.setKeepforValue(keepfor, custom_keepfor, keep_items);
    }
    async loadNaming() {
        let data = await browser.storage.local.get(["prefix", "suffix", "format_year", "format_mon", "format_day"]);

        if (undefined === data || null === data) {
            return;
        }

        let { prefix, suffix, format_year, format_mon } = data;

        if (Utils.isString(prefix)) {
            query("#naming_prefix").value = prefix;
        }

        if (Utils.isString(suffix)) {
            query("#naming_suffix").value = suffix;
        }

        if (Utils.isNoneEmptyString(format_year)) {
            query(`[data-fy='${format_year}']`).checked = true;
        }
        if (Utils.isNoneEmptyString(format_mon)) {
            query(`[data-fm='${format_mon}']`).checked = true;
        }

        this.displayExampleName();
    }

    async loadOtherSettings() {
        let data = await browser.storage.local.get(["folder_name"]);

        if (undefined === data || null === data) {
            return;
        }

        let { folder_name } = data;
        if (Utils.isNoneEmptyString(folder_name)) {
            query("#folder_naming").value = folder_name;
        }
    }
    translation() {
        this.interface.doTheTranslation();
    }

    displayExampleName() {
        this.interface.displayExampleName();
    }
    /**
    * Retrieves input values and sets interval and keepfor values
    */
    async saveInterval() {
        let interval = this.interface.getIntervalValue();

        let custom_interval = "60";

        if ("c" === interval) {
            custom_interval = query("#interval_range").value;
        }
        await browser.storage.local.set({ interval, custom_interval });
    }

    async saveKeepfor() {
        let keepfor = this.interface.getKeepforValue();

        let custom_keepfor = "48";

        if ("c" === keepfor) {
            custom_keepfor = query("#keepfor_range").value;
        }
        let keep_items = "48";
        if ("mx" === keepfor) {
            //debugger;
            keep_items = query("#keepfor_items").value;
        }
        await browser.storage.local.set({ keepfor, custom_keepfor, keep_items });
    }

    async SaveNaming() {
        let prefix = query("#naming_prefix").value;

        let suffix = query("#naming_suffix").value;

        await browser.storage.local.set({ prefix, suffix });

        let format_year = "numeric";
        let radio = query("input[name=format_year]:checked");
        if (radio !== undefined && radio !== null) {
            format_year = radio.value;
        }
        await browser.storage.local.set({ format_year });

        let format_mon = "numeric";
        radio = query("input[name=format_mon]:checked");
        if (radio !== undefined && radio !== null) {
            format_mon = radio.value;
        }
        await browser.storage.local.set({ format_mon });
    }

    async SaveOtherSettings() {
        let folder_name = val("folder_naming");
        await browser.storage.local.set({ folder_name });
    }

    setEvents() {
        this.interface.setEvents();
        query("#save_interval")[on]("click", this.saveInterval.bind(this));
        query("#save_keep")[on]("click", this.saveKeepfor.bind(this));
        query("#save_naming")[on]("click", this.SaveNaming.bind(this));
        query("#save_other")[on]("click", this.SaveOtherSettings.bind(this));
    }
}

const settings = new AutoBookmarkerSettings();
settings.loadData();
settings.setEvents();