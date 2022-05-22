'use strict';

const Fs = require('fs');
const Path = require('path');
const Schedule = require('./schedule.json'); // https://raw.githubusercontent.com/nodejs/Release/master/schedule.json
const Yaml = require('yaml');


const internals = {
    out: process.argv[2]
};


internals.write = (folder, versions) => {

    versions = versions.sort((a, b) => b - a);

    for (let i = 0; i < versions.length; i++) {

        const gte = versions[i];
        const gteVersions = versions.slice(0, i + 1);

        const file = Path.join(process.argv[2], folder, `gte-${gte}.yml`);

        const output = Yaml.stringify({
            node_js: gteVersions
        });

        Fs.writeFileSync(file, output);
    }
};


internals.main = async () => {

    if (!Fs.statSync(internals.out)) {
        throw new Error(`${internals.out} is not a folder`);
    }

    // const today = new Date().toISOString().substr(0, 10);
    const today = '2022-06-02';

    const versions = {
        all: [],
        lts: [],
        ltsStrict: []
    };

    for (const [version, meta] of Object.entries(Schedule)) {

        if (version.startsWith('v0.')) {
            continue; // ignore 0.x - they're irrelevant at this point
        }

        const versionNumber = parseInt(version.substr(1), 10);

        if (meta.start > today) {
            continue; // not released yet
        }

        versions.all.push(versionNumber);

        const isLtsStarted = meta.lts && meta.lts <= today;
        const isCurrent = meta.end >= today;

        if (isLtsStarted) {
            versions.ltsStrict.push(versionNumber);
        }

        if (isLtsStarted || isCurrent) {
            versions.lts.push(versionNumber);
        }
    }

    internals.write('all', versions.all);
    internals.write('lts', versions.lts);
    internals.write('lts/strict', versions.ltsStrict);
};

internals.main().catch((err) => {

    console.error(err);
    process.exit(1);
});
