/*
This file is extensions to ArchiveItem that probably in some form could go back into dweb-archive
TODO write reviews

 */

//Standard repos
const fs = require('fs');   // See https://nodejs.org/api/fs.html
const path = require('path');
const canonicaljson = require('@stratumn/canonicaljson');
// Other IA repos
const ArchiveItem = require('@internetarchive/dweb-archive/ArchiveItem');
// Other files from this repo
const MirrorFS = require('./MirrorFS');
const errors = require('./Errors');


ArchiveItem.prototype._dirpath = function(directory) {
        return path.join(directory, this.itemid);
    };

ArchiveItem.prototype.save = function({cacheDirectory = undefined} = {}, cb) {
    /*
        Save _meta and _members as JSON
    */
    console.assert(cacheDirectory, "ArchiveItem needs a directory in order to save");
    let itemid = this.itemid; // Its also in this.item.metadata.identifier but only if done a fetch_metadata
    let dirpath = this._dirpath(cacheDirectory);

    function _err(msg, err, cb) {
        console.error(msg, err);
        if (cb) {
            cb(err);
        } else {
            throw(err)
        }
    }

    MirrorFS._mkdir(dirpath, (err) => {
        if (err) {
            _err(`Cannot mkdir ${dirpath} so cant save item ${itemid}`, err, cb);
        } else {
            let filepath = path.join(dirpath, itemid + "_meta.json");
            fs.writeFile(filepath, canonicaljson.stringify(this.item.metadata), (err) => {
                if (err) {
                    _err(`Unable to write to ${itemid}`, err, cb);
                } else {

                    let filepath = path.join(dirpath, itemid + "_files.json");
                    fs.writeFile(filepath, canonicaljson.stringify(this.item.files), (err) => {
                        if (err) {
                            _err(`Unable to write to ${itemid}`, err, cb);
                        } else {
                            let filepath = path.join(dirpath, itemid + "_reviews.json");
                            fs.writeFile(filepath, canonicaljson.stringify(this.item.reviews), (err) => {
                                if (err) {
                                    _err(`Unable to write to ${itemid}`, err, cb);
                                } else {
                                    cb(null, this);
                                }
                            });
                        }
                    })
                }
            });
        }
    });
}
ArchiveItem.prototype.read = function({cacheDirectory = undefined} = {}, cb) {
        let filename = path.join(cacheDirectory, this.itemid, `${this.itemid}_meta.json`);
        fs.readFile(filename, (err, metadataJson) => {
            if (err) {
                cb(new errors.NoLocalCopy());
            } else {
                let filename = path.join(cacheDirectory, this.itemid, `${this.itemid}_files.json`);
                fs.readFile(filename, (err, filesJson) => {
                    if (err) {
                        cb(new errors.NoLocalCopy()); // Will typically drop through and try net
                    } else {
                        let files = canonicaljson.parse(filesJson);
                        let filesCount = files.length;
                        let filename = path.join(cacheDirectory, this.itemid, `${this.itemid}_reviews.json`);
                        fs.readFile(filename, (err, reviewsJson) => {
                            if (err) {
                                cb(new errors.NoLocalCopy());
                            } else {
                                cb(null, {
                                        //Omitted from standard dweb.archive.org/metadata/foo call as irrelevant and/or unavailable:
                                        //  Unavailable but would be good: collection_titles
                                        // Unavailable and not needed: created, d1, d2, dir, item_size, server, uniq, workable_servers
                                        files: files,
                                        files_count: filesCount,
                                                metadata: canonicaljson.parse(metadataJson),
                                                reviews: canonicaljson.parse(reviewsJson),
                                    });
                            }
                        });
                    }
                });
            }
        });
    }

ArchiveItem.prototype.loadMetadata = function({cacheDirectory=undefined}={}, cb) {
    /*
    More flexible version of loading metadata
    Alternatives:
    !cacheDirectory:    load from net
    cached:             return from cache
    !cached:            Load from net, save to cache

    cb(err, this)
    TODO fetch_query should probably use loadMetadata but tricky as fetch_query doesnt know the cacheDirectory
     */
    if (cacheDirectory) {
        this.read({cacheDirectory}, (err, metadata) => {
            if (err) {
                this.fetch_metadata((err, ai) => {
                    if (err) {
                        cb(err); // Failed to read & failed to fetch
                    } else {
                        ai.save({cacheDirectory}, cb);  // Save data fetched
                    }
                });    // resolves to this
            } else {    // Local read succeeded.
                this.item = metadata;
                cb(null, this);
            }
        })
    } else {
        this.fetch_metadata(cb);
    }
}


exports = module.exports = ArchiveItem;