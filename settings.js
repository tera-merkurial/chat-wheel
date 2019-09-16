'use strict';

const DefaultSettings = {
    "fixRaidQuickChat": true,
    "enableNoticeWheel": false,
    quickWheel: {
        'global':
            [
                "<FONT size='13' color='#34bbff'>Please come help!</FONT>",
                "<FONT size='13' color='#34bbff'>You'd better move now.</FONT>",
                "<FONT size='13' color='#34bbff'>Get ready! Monsters incoming.</FONT>",
                "<FONT size='13' color='#34bbff'>Wait up! I'm not ready.</FONT>"
            ]
    },
    commands: [
        "<FONT size='13' color='#34bbff'>Please come help!</FONT>",
        "<FONT size='13' color='#34bbff'>You'd better move now.</FONT>",
        "<FONT size='13' color='#34bbff'>Get ready! Monsters incoming.</FONT>",
        "<FONT size='13' color='#34bbff'>Wait up! I'm not ready.</FONT>"
    ]
};

function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    }
    else if (from_ver === null) {
        return DefaultSettings;
    }
    else {
        if (from_ver + 1 < to_ver) {
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }

        switch (to_ver) {
            //
        }

        return settings;
    }
}

module.exports = MigrateSettings;