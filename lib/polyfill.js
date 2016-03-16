/*globals module */

module.exports = {};

/** DOESNT WORK **/
if (!Date.now) {
    Object.defineProperty(Date.prototype, "now", {
        value: function now() {
            "use strict";
            return new Date().getTime();
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

if (!Array.prototype.find) {
    Array.prototype.find = function find(f) {
        "use strict";
        var i;
        for (i in this) {
            if (this.hasOwnProperty(i)) {
                if (f(this[i], i)) {
                    return this[i];
                }
            }
        }
        return undefined;
    };
}