#Popcorn Time [![Dependency Status](https://david-dm.org/popcorn-official/popcorn-app.svg)](https://david-dm.org/popcorn-official/popcorn-app) [![Build Status](https://travis-ci.org/popcorn-official/popcorn-app.svg?branch=dev-0.3)](https://travis-ci.org/popcorn-official/popcorn-app)

### Idea

To allow any computer user to watch movies easily streaming from torrents, without any particular knowledge.

![](http://i.imgur.com/OVMJkCB.png)
![](http://i.imgur.com/MyJIzbX.png)
![](http://i.imgur.com/xWo9U24.png)
![](http://i.imgur.com/YdPiqKH.png)
![](http://i.imgur.com/yILXXpf.png)
### APIs

**Currently used:**
- [YIFY](http://yts.re/api) movie torrents API.
- [YifySubtitles](http://www.yifysubtitles.com) for movie subtitles
- [OpenSubtitles](http://www.opensubtitles.org) for tv shows subtitles
- [Trakt.tv](https://trakt.tv/) for movies metadata.
- [EZTV](http://eztv.it) for TV Show torrents

### Development

See [Development's page](https://github.com/popcorn-official/popcorn-app/wiki/Build-and-Debug)

### How to contribute

First, building, testing and reporting bug is highly appreciated. Please include console's output and reproduction step in your bug report.

If you want to develop, you can look at the issues, especialy the bug and fix them.
Here's a [list of feature](http://github.com/popcorn-official/popcorn-app/issues?labels=feature-request) requested by the community so far.

Please follow the [contributions guidelines](https://github.com/popcorn-official/popcorn-app/blob/master/CONTRIBUTING.md).

It is recommended to join us on IRC at `#popcorntime` on freenode ([web access](http://webchat.freenode.net/?channels=popcorntime)), most active developers hang in there. You can ask `phnz` or  `Sharkiller` for high priority task.

## Any problem?

### Need to report a bug? [Read the report guideline](https://github.com/popcorn-official/popcorn-app/blob/master/CONTRIBUTING.md#report-a-bug)

### Error about missing libudev.so.0
Search for libudev.so.0 on your distribution. Most of the time it can be easily fixed by creating a symbolic link from libudev.so to libudev.so.0

See: https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0

### Error "Gtk-WARNING **: cannot open display:"
Try running `export DISPLAY=:0.0`

### Error "The video format is not supported"
See: https://github.com/rogerwang/node-webkit/wiki/Support-mp3-and-h264-in-video-and-audio-tag

***

If you distribute a copy or make a fork of the project, you have to credit this project as source.
	
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 
You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/ .

***

If you want to contact us : hello@popcorntime.io
 
Copyright © 2014 - Popcorn Time and the contributors (popcorntime.io)

Popcorn Time is released under the GPL
