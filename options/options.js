class AutoBookmarkerOptionsInterface {

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

        let intervals = query_all("input[name=interval]");
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
        let intervals = query_all("input[name=interval]");
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
            range.enable();
            return;
        }
        if ("mx" === value) {
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

        let keepers = query_all("input[name=keepfor]");
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
        let keepers = query_all("input[name=keepfor]");
        for (const keep of keepers) {
            if (keep.checked) {
                return keep.value;
            }
        }
    }

    setEvents() {
        let intervals = query_all("input[name=interval]");
        for (const inter of intervals) {
            inter[on]("change", this.onIntervalChange.bind(this));
        }

        let keepers = query_all("input[name=keepfor]");
        for (const keep of keepers) {
            keep[on]("change", this.onKeepforChange.bind(this));
        }
    }
}

class AutoBookmarkerOptions {
    constructor() {
        this.data = this.setDefaultData();
        this.interface = new AutoBookmarkerOptionsInterface();
    }
    setDefaultData() {
        let data = Object.create(null);
        data.interval = "";
        data.keepfor = "";
        return data;
    }

    async loadData() {
        await this.loadInterval();
        await this.loadKeepfor();
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

    async openFullSettings() {
        let createProperties = {
            url: "settings.html",
            active: true
        }
        await browser.tabs.create(
            createProperties
        )
    }

    async saveOptions(){
        await this.saveInterval();
        await this.saveKeepfor();
    }
    setEvents() {
        this.interface.setEvents();
        query("#full_throtle")[on]("click", this.openFullSettings.bind(this));
        query("#action")[on]("click", this.saveOptions.bind(this));
    }
}

const options = new AutoBookmarkerOptions();
options.loadData();
options.setEvents();