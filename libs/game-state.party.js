class Party {
    get inRaid() { return this.m_inRaid; }
    get isLeader() { return this.m_isLeader; }

    constructor(mod) {
        this.m_inRaid = false;
        this.m_isLeader = false;

        this.mod = mod;
        this.installHooks();
    }

    installHooks() {
        this.mod.hook('S_PARTY_MEMBER_LIST', 7, event => {
            this.inRaid = event.raid;
            var sameServer = event.leaderServerId == this.mod.game.me.serverId;
            var samePlayerId = event.leaderPlayerId == this.mod.game.me.playerId;
            this.isLeader = sameServer && samePlayerId;
        })

        this.mod.hook('S_CHANGE_PARTY_MANAGER', 2, event => {
            var sameServer = event.serverId == this.mod.game.me.serverId;
            var samePlayerId = event.playerId == this.mod.game.me.playerId;
            this.isLeader = sameServer && samePlayerId;
        })

        this.mod.hook('S_LEAVE_PARTY', 1, event => {
            this.inRaid = false;
            this.isLeader = false;
        })

        this.installHook(mod, 'S_RETURN_TO_LOBBY', 'raw', (event) => {
            this.Reset();
        })
    }

    Reset() {
        this.m_inRaid = false;
        this.m_isLeader = false;
    }
}

module.exports = Party;