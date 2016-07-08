/*
 * Copyright 2012-2013 AGR Audio, Industria e Comercio LTDA. <contato@moddevices.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

JqueryClass('upgradeWindow', {
    init: function (options) {
        var self = $(this)

        options = $.extend({
            icon: $('<div>'),
            windowManager: $('<div>'),
            startUpgrade: function (callback) {
                callback(true)
            },
        }, options)

        self.data(options)
        self.data('updatedata', null)

        options.icon.statusTooltip()
        options.icon.statusTooltip('message', 'Checking for updates...', true)

        options.icon.click(function () {
            self.upgradeWindow('open')
        })

        $('body').keydown(function (e) {
            if (e.keyCode == 27)
                self.upgradeWindow('close')
        })

        self.find('.js-close').click(function () {
            self.upgradeWindow('close')
        })

        self.find('button.js-upgrade').click(function () {
            if ($(this).text() == "Upgrade Now") {
                self.upgradeWindow('startUpgrade')
            } else {
                self.upgradeWindow('downloadStart')
            }
        })

        self.hide()

        return self
    },

    open: function () {
        var self = $(this)
        var data = self.data('updatedata')

        if (! data) {
            return
        }

        var p = self.find('.mod-upgrade-details').find('p')
        $(p[0]).html("Update version <b>" + data['version'].replace("v","") + "</b>.")
        $(p[1]).text("Released on " + data['release-date'].split('T')[0] + ".")

        self.show()
    },

    close: function () {
        $(this).hide()
    },

    setup: function (required, data) {
        var self = $(this)
        var icon = self.data('icon')

        self.data('updatedata', data)
        icon.statusTooltip('message', "An update is available, click to know details", false, 5000)
        icon.statusTooltip('status', 'update-available')

        if (required) {
            // TODO
        }
    },

    setErrored: function () {
        var self = $(this)
        var icon = self.data('icon')

        icon.statusTooltip('message', "Failed to connect to MOD Cloud", true)
        icon.statusTooltip('status', 'uptodate')
    },

    setUpdated: function () {
        var self = $(this)
        var icon = self.data('icon')

        icon.statusTooltip('message', "System is up-to-date", true)
        icon.statusTooltip('status', 'uptodate')
    },

    downloadStart: function () {
        var self = $(this)
        self.find('.mod-upgrade-details').hide()
        self.find('.download-progress').show()
        self.find('.progressbar').width(0)

        self.find('.download-start').show().text("Downloading...")
        self.find('.download-complete').hide()

        var url = self.data('updatedata')['download-url']

        // TESTING
        //url = "http://pipeline.moddevices.com/image/577e601e2564d4678c024a5c/file/"

        var transfer = new SimpleTransference(url, '/update/download')

        transfer.reportPercentageStatus = function (percentage) {
            self.find('.progressbar').width(self.find('.progressbar-wrapper').width() * percentage)

            if (percentage == 1) {
                self.find('.download-start').text("Preparing update...")
            }
        }

        transfer.reportFinished = function (resp) {
            self.find('.mod-upgrade-details').show().find('p:lt(2)').show()
            self.find('.download-progress').hide()
            self.find('button.js-upgrade').text("Upgrade Now")

            self.find('.download-start').hide()
            self.find('.download-complete').show()

            if (!confirm("The MOD will now be updated. Any unsaved work will be lost. The upgrade can take several minutes, in which you may not be able to play or do anything else. Continue?"))
                return

            self.upgradeWindow('startUpgrade')
        }

        transfer.reportError = function (error) {
            self.find('.mod-upgrade-details').show().find('p:lt(2)').hide()
            self.find('button.js-upgrade').text("Retry")

            self.find('.download-start').show().text("Download failed!")
            self.find('.download-complete').hide()
        }

        console.log("Trying to download", url)
        transfer.start()
    },

    startUpgrade: function () {
        var self = $(this)

        self.data('startUpgrade')(function (ok) {
            if (ok) {
                desktop.blockUI()
            } else {
                new Bug("Failed to start upgrade")
            }
        })
    },
})
