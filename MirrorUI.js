const errors = require('./Errors.js');

class MirrorUI {
/*
Drives the UI on port 4245
NOT CURRENTLY USED
 */
    server() {
        //TODO-MIRROR figure out how to use Node to server on a port; get request; dispatch based on request; build response; return it
    }
    addcollection(itemid) {
        throw new errors.ToBeImplementedError("MirrorUI.addcollection");
    }
    additem(itemid) {
        throw new errors.ToBeImplementedError("MirrorUI.additem");
    }
}
exports = module.exports = MirrorUI;