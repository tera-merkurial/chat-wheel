'use strict'

const wheelPosition = ['Left', 'Top', 'Right', 'Bottom']
const dungeonNames = require('./data/dungeons.json')
const positionNames = {
    'left': 0,
    'top': 1,
    'right': 2,
    'bottom': 3
}

class ChatWheel {
    constructor(mod) {
        this.mod = mod

        this.isRecording = false
        this.recordType = ''
        this.recordPosition = 0
        this.settings = mod.settings
        this.quickWheel = this.settings.quickWheel
        this.inRaid = false
        this.isLeader = false

        this.wheelPhrases = mod.settings.quickWheel['global']
        this.wheelCommands = mod.settings.commands

        mod.game.me.on('change_zone', (zone, quick) => {
            var playerName = mod.game.me.name
            var serverId = mod.game.me.serverId
            var playerUid = `${playerName}:${serverId}`

            var isDungeon = mod.game.me.inDungeon


            if (this.LoadChatWheel(playerUid, zone) == true) {
                this.mod.command.message(`Phrases changed for ${zone in dungeonNames ? dungeonNames[zone] : 'current zone'}`)
                this.ShowCurrentChatWheel()
            }
        })

        mod.hook('S_PARTY_MEMBER_LIST', 7, event => {
            this.inRaid = event.raid
            var sameServer = event.leaderServerId == this.mod.game.me.serverId
            var samePlayerId = event.leaderPlayerId == this.mod.game.me.playerId
            this.isLeader = sameServer && samePlayerId
        })

        mod.hook('S_CHANGE_PARTY_MANAGER', 2, event => {
            var sameServer = event.serverId == this.mod.game.me.serverId
            var samePlayerId = event.playerId == this.mod.game.me.playerId
            this.isLeader = sameServer && samePlayerId
        })

        mod.hook('S_LEAVE_PARTY', 1, event => {
            this.inRaid = false
            this.isLeader = false
        })

        mod.hook('C_CHAT', 1, event => {
            if (this.isRecording == true) {
                this.UpdateConfig(this.recordType, this.recordPosition, event.message)
                return false
            }

            var result = undefined

            // Replace message for the chat wheel one.
            // Check first for Dungeon/Character combination
            // then Character
            // then Global
            for (var i = 0; i < this.wheelCommands.length; i++) {
                var command = this.wheelCommands[i]

                if (this.ShouldReplaceMessage(event.message, command) == true) {
                    event.message = `<FONT>${this.wheelPhrases[i]}</FONT>`
                    result = true
                    break;
                }
            }

            // Elevate to raid message, need to check if we're in a raid
            if (this.settings.fixRaidQuickChat && this.inRaid && event.channel == 1) {
                event.channel = 32
                result = true
            }

            // Elevate to raid notice, need to check if you're leader
            if (this.settings.enableNoticeWheel && this.isLeader && event.channel == 1) {
                event.channel = 25
                result = true
            }

            return result
        })

        /*
        Available commands:
        chat-wheel : Returns currently configured phrases
        chat-wheel record cmd left|top|right|bottom : Records next sent message as the command to trigger each phrase
        chat-wheel record global|me|dungeon|current left|top|right|bottom : Records next sent message as the chat wheel message for :
            * global : Global chat wheel
            * me : Currently logged character global
            * dungeon : Global dungeon wheel
            * current : Currently logged character dungeon wheel
        chat-wheel notice on|off : Enable/Disable sending wheel as notice (useful for mech calling)
        */
        mod.command.add('chat-wheel', {
            $default: this.ShowCurrentChatWheel,
            'notice': this.NoticeCommand,
            'record': this.RecordCommand,
        }, this)
    }

    UpdateConfig(type, position, message) {
        var playerName = this.mod.game.me.name
        var serverId = this.mod.game.me.serverId
        var playerUid = `${playerName}:${serverId}`
        var zone = this.mod.game.me.zone

        switch (type) {
            case 'cmd': {
                this.mod.settings.commands[position] = message
                break
            }
            case 'global': {
                this.mod.settings.quickWheel['global'][position] = message
                break
            }
            case 'me': {
                // Initialize my config if doesn't exist
                if (playerUid in this.mod.settings.quickWheel == false) {
                    this.mod.settings.quickWheel[playerUid] = {
                        'global': this.mod.settings.quickWheel['global']
                    }
                }

                this.mod.settings.quickWheel[playerUid]['global'][position] = message
                break
            }
            case 'dungeon': {
                // Initialize dungeon if doesn't exist
                if (zone in this.mod.settings.quickWheel == false) {
                    this.mod.settings.quickWheel[zone] = this.mod.settings.quickWheel['global']
                }

                this.mod.settings.quickWheel[zone][position] = message
                break
            }
            case 'current': {
                // Initialize my config
                if (playerUid in this.mod.settings.quickWheel == false) {
                    this.mod.settings.quickWheel[playerUid] = {
                        'global': this.mod.settings.quickWheel['global']
                    }
                }

                // Initialize dungeon config
                if (zone in this.mod.settings.quickWheel[playerUid] == false) {
                    this.mod.settings.quickWheel[playerUid][zone] = this.mod.settings.quickWheel[playerUid]['global']
                }

                this.mod.settings.quickWheel[playerUid][zone][position] = message
                break
            }
        }

        this.isRecording = false
        this.LoadChatWheel(playerUid, zone)
        this.ShowCurrentChatWheel()
    }

    NoticeCommand(...args) {
        if (args.length == 0) {
            this.mod.command.message(`Notice wheel is currently ${this.settings.enableNoticeWheel ? 'enabled' : 'disabled'}`)
        } else if (args.length == 1) {
            var newstate = args[0].toLowerCase()
            if (newstate == 'on') {
                this.mod.command.message(`Notice wheel set to enabled`)
                this.settings.enableNoticeWheel = true
            } else if (newstate == 'off') {
                this.mod.command.message(`Notice wheel set to disabled`)
                this.settings.enableNoticeWheel = false
            } else {
                this.ShowNoticeCommandUsage()
            }
        }
    }

    ShowNoticeCommandUsage() {
        this.mod.command.message(`Usage : chat-wheel notice [on|off]`)
    }

    RecordCommand(...args) {
        if (args.length != 2) {
            this.ShowRecordCommandUsage()
            return
        }

        var option = args[0].toLowerCase()
        var position = args[1].toLowerCase()

        var validOptions = ['cmd', 'global', 'me', 'dungeon', 'current']
        if (validOptions.includes(option) && position in positionNames) {
            this.isRecording = true
            this.recordType = option
            this.recordPosition = positionNames[position]
            this.mod.command.message(`Your next message will update your config for ${option} ${position}`)
        } else {
            this.ShowRecordCommandUsage()
            return
        }
    }

    ShowRecordCommandUsage() {
        this.mod.command.message(`Usage :`)
        this.mod.command.message(`        chat-wheel record cmd|global|me|dungeon|current left|top|right|bottom`)
    }

    ShouldReplaceMessage(message, expected) {
        if (Array.isArray(expected)) {
            if (expected.includes(message)) {
                return true
            }
        } else {
            if (message == expected) {
                return true
            }
        }

        return false
    }

    destructor() {
        this.mod.saveSettings()
    }

    ShowCurrentChatWheel() {
        for (var i = 0; i < 4; i++) {
            this.mod.command.message(`${wheelPosition[i]}: ${this.wheelPhrases[i]}`)
        }
    }

    LoadChatWheel(playerUid, zone) {
        var hasPlayerChat = playerUid in this.quickWheel
        var hasPlayerDungeonChat = hasPlayerChat ? zone in this.quickWheel[playerUid] : false
        var hasDungeonChat = zone in this.quickWheel

        // Dungeon/Player specific chat
        if (hasPlayerDungeonChat) {
            this.wheelPhrases = this.quickWheel[playerUid][zone]
            return true
        }

        // Global dungeon specific chat
        if (hasDungeonChat) {
            this.wheelPhrases = this.quickWheel[zone]
            return true
        }

        // Player specific chat
        if (hasPlayerChat) {
            this.wheelPhrases = this.quickWheel[playerUid]['global']
            return true
        }

        // Default chat
        this.wheelPhrases = this.quickWheel['global']
        return true
    }
}

module.exports = ChatWheel