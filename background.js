const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = SECOND * 3600;
const DAY = HOUR * 24;

class AutoBookmarkerConfig {
    constructor() {
        this.conf = Object.create(null);
        this.loadDefaults();
    }
    loadDefaults() {
        const defaultFormat = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        this.conf.formatOptions = Object.create(null);
        for (const k in defaultFormat) {
            this.conf.formatOptions[k] = defaultFormat[k];
        }

        this.conf.prefix = "";
        this.conf.suffix = "_tabs";
        this.conf.locale = "default";
        this.conf.debuging = false;
        this.conf.debugEntropy = 64;
        this.conf.debugRandomRadix = "16";
        this.conf.folderName = "mudbooker_tabs";
        this.conf.interval = HOUR * 1;
        this.conf.keepfor = DAY * 2;
    }

    get prefix() {
        return this.conf.prefix;
    }
    set prefix(pfx) {
        if (!Utils.isString(pfx)) {
            return false;
        }
        this.conf.prefix = pfx;
        return true;
    }

    get suffix() {
        return this.conf.suffix;
    }
    /**
     * @param {String} sfx
     */
    set suffix(sfx) {
        if (!Utils.isString(sfx)) {
            return false;
        }
        this.conf.suffix = sfx;
        return true;
    }

    get format() {
        return this.conf.formatOptions;
    }

    set format(fmt) {
        //hour and minute stay as they are (2-digit)
        const VALID_KEYS = {
            year: ["2-digit", "numeric"],
            month: ["numeric", "long", "short"]
        };
        for (const k in fmt) {
            //ignore undescribed keys
            if (VALID_KEYS[k] === undefined) {
                continue;
            }
            let validValues = VALID_KEYS[k];
            let value = fmt[k];
            // ignore nondescribed values
            if (!Utils.contains(validValues, value)) {
                continue;
            }
            //assign correct value
            this.conf.formatOptions[k] = value;
        }
    }

    get folderName() {
        return this.conf.folderName;
    }

    set folderName(fold) {
        if (!Utils.isNoneEmptyString(fold)) {
            return false;
        }
        this.conf.folderName = fold;
        return true;
    }

    async loadNaming() {
        let sarraya = ["prefix", "suffix", "format_year", "format_mon", "folder_name"];

        let data = await browser.storage.local.get(sarraya);

        if (undefined === data || null === data) {
            return;
        }
        let { prefix, suffix, format_year, format_mon, folder_name } = data;

        this.prefix = prefix;
        this.suffix = suffix;

        const fmt = { year: format_year, month: format_mon }

        this.format = fmt;
        this.folderName = folder_name;
    }

    get debug() {
        let debug = Object.create(null);
        debug.enabled = this.conf.debuging;
        debug.entropy = this.conf.debugEntropy;
        debug.radix = this.conf.debugRandomRadix;
        return debug;
    }

    set debug(dbg) {
        if (typeof dbg !== "boolean") {
            return false;
        }
        this.conf.debuging = dbg;
    }

    get interval() {
        return this.conf.interval;
    }
    set interval(num) {
        if (!Utils.isPositiveInteger(num)) {
            return false;
        }
        this.conf.interval = num;
    }
    /**
     * @returns {Promise<Integer>}
     */
    async loadInterval() {
        if (this.debuging) {
            return this.interval;
        }
        let data = await browser.storage.local.get(["interval", "custom_interval"]);
        if (undefined === data || null === data) {
            //if no valid data, do nothing and return existing value
            return this.interval;
        }

        let { interval, custom_interval } = data;
        if (undefined === interval || undefined === custom_interval) {
            return this.interval;
        }
        if ("c" === interval) {
            interval = Utils.parseIntervalRange(custom_interval);
        } else {
            interval = Utils.convertInterval(interval);
        }

        this.interval = interval;
        return interval;
    }

    get keepfor() {
        return this.conf.keepfor;
    }

    set keepfor(num) {
        if (!Utils.isPositiveInteger(num)) {
            return false;
        }
        this.conf.keepfor = num;
    }

    /**
     * @returns {Promise<Integer>}
     */
    async loadKeepfor() {
        if (this.debug.enabled) {
            //return existing value
            return this.keepfor;
        }
        let data = await browser.storage.local.get(["keepfor", "custom_keepfor"]);
        if (undefined === data || null === data) {
            //if no valid data, do nothing and return existing value
            return this.keepfor;
        }

        let { keepfor, custom_keepfor } = data;
        if (undefined === keepfor || undefined === custom_keepfor) {
            return this.keepfor;
        }

        if ("c" === keepfor) {
            keepfor = Utils.parseKeepforRange(custom_keepfor);
        } else {
            keepfor = Utils.convertKeepfor(keepfor);
        }

        this.keepfor = keepfor;
        return keepfor;
    }

}
class AutoBookmarker {
    constructor() {
        this.config = new AutoBookmarkerConfig();
        // process data
        const pdata = Object.create(null);
        pdata.last_time = 0;
        pdata.next_time = 0;
        this.pdata = pdata;
    }
    async touchParentID() {
        let folder_name = this.config.folderName;
        let bookers = await browser.bookmarks.search({ query: folder_name });

        if (bookers.length < 1) {
            //if doesn't exist, then create it
            let booker = await browser.bookmarks.create({
                title: this.config.folderName,
                parentId: "toolbar_____"
            });
            return booker.id;
        }

        return bookers[0].id;
    }

    async removeOldFolders() {
        //debugger;
        let keep = this.config.keepfor;
        //for max number use reverse sort
        //168 * 4 = 672
        const sorter = (a, b) => {
            if (a.dateAdded < b.dateAdded) {
                return -1;
            }
            if (a.dateAdded > b.dateAdded) {
                return 1;
            }
            return 0;
        }

        let parent_id = await this.touchParentID();

        let children = await browser.bookmarks.getChildren(parent_id);

        let earlyDate = new Date(Date.now() - keep);

        //do split
        let selectedForDeletion = children.filter(e => e.dateAdded <= earlyDate);
        selectedForDeletion.sort(sorter);

        if (selectedForDeletion.length > 0) {
            selectedForDeletion.pop();
        }

        try {
            for (const fold of selectedForDeletion) {
                let dat = new Date(fold.dateAdded);
                console.log(`Now deleting bookmark added on ${dat.toLocaleString()}`);
                await browser.bookmarks.removeTree(fold.id);
            }
        } catch (e) {
            console.log(e);
        } finally {

        }

    }

    /**
    * @returns {Promise<Boolean>}
    */
    async loadAndSetInterval() {
        let oldInterval = this.config.interval;
        let interval = await this.config.loadInterval();
        //if interval was changed
        if (oldInterval !== interval) {
            console.log(oldInterval, interval);
            this.restart();
        }
        return true;
    }

    //the main function
    async runner() {
        console.log(281);
        //search tabs
        let tabs = await browser.tabs.query({});

        //load variables
        let { locale, format, prefix, suffix, debug } = this.config;

        let formated = new Date().toLocaleString(locale, format).replace(/[\s.,]+/gi, "_").replace(/:/, "h");
        //fix undefined prefix/suffix bug , caused of which is not determined yet (on loading/set naming bug might be)
        let title = `${formated}`
        if (Utils.isNoneEmptyString(prefix)) {
            title = `${prefix}${title}`;
        }
        if (Utils.isNoneEmptyString(suffix)) {
            title = `${title}${suffix}`;
        }

        if (debug.enabled) {
            //add some randomness
            let _substr = `_${Utils.GetRandomString(debug.entropy, debug.radix)}`;
            title = title.concat(_substr);
        }

        let parent_id = await this.touchParentID();
        //console.log(parent_id);
        let newFolder = await browser.bookmarks.create({ title, parentId: parent_id });

        const folder_id = newFolder.id;

        //save tabs to folder
        for (const t of tabs) {
            const { title, url } = t;
            await browser.bookmarks.create({ parentId: folder_id, title, url });
        }

        this.pdata.last_time = Date.now();
        this.pdata.next_time = this.pdata.last_time + this.config.interval;

        let nudate = new Date(this.pdata.last_time);
        let message = `${nudate.getHours()}:${nudate.getMinutes()} - tabs were bookmarked`;

        browser.notifications.create({
            "type": "basic",
            "iconUrl": browser.runtime.getURL("icons/logo.png"),
            "title": "MudBooker",
            "message": message
        });

        await browser.storage.local.set({ last: this.pdata.last_time, next: this.pdata.next_time });

        await this.removeOldFolders();
    }
    async loadDataFromLocalStorage() {
        await this.loadAndSetInterval();
        await this.config.loadKeepfor();
        await this.config.loadNaming();
    }
    /**
     * Start
     */
    async start() {
        //if process is running then not start again
        //restart is seperate function
        if (this.pdata.runner_id !== undefined) {
            return false;
        }
        this.runner();
        let interval = this.config.interval;
        const runner_bounded = this.runner.bind(this);
        this.pdata.runner_id = window.setInterval(runner_bounded, interval);
    }
    /**
     * Restart
     * @returns 
     */
    async restart() {
        if (this.pdata.runner_id === undefined) {
            return false;
        }
        this.runner();
        window.clearInterval(this.pdata.runner_id);
        let interval = this.config.interval;
        const runner_bounded = this.runner.bind(this);
        this.pdata.runner_id = window.setInterval(runner_bounded, interval);
    }
}

const mdBooker = new AutoBookmarker();
mdBooker.loadDataFromLocalStorage();
mdBooker.start();

browser.storage.onChanged.addListener(async () => {
    console.log(372);
    await mdBooker.loadDataFromLocalStorage();
});

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.command == "tuesday") {
        mdBooker.restart();
    }
});