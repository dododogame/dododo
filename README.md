# Dododo

A rhythm game with musical rhythm notations!

Get access to the game through [the webpage](https://dododogame.github.io/dododo/).
This git repo is a submodule of [the Dododo game's website](https://github.com/dododogame/dododogame.github.io/).
You can also download the game for playing offline from the [releases page](https://github.com/dododogame/dododo/releases).
There are pre-built packages for 64-bit Windows and Linux.
If you want the 32-bit version, you can [build it yourself](#build-the-desktop-app).

Join our [Discord server](https://discord.gg/yYdMw5hm2K).

For more information, go to the [wiki page](https://dododogame.github.io/wiki/).

## Game engine

The game is based on [RPG Maker MV CoreScript](https://github.com/rpgtkoolmv/corescript) (MIT license),
but it is not made by [RPG Maker MV](https://www.rpgmakerweb.com/products/rpg-maker-mv).
The game utilizes no other company materials of RPG Maker MV except the font M Plus 1m regular (SIL Open Font License).

The RPG Maker MV CoreScript is based on [PixiJS](https://pixijs.com/).

## Serve the game locally

*Note: if you play the game in this way, you still need internet access.*

[Install Ruby](https://www.ruby-lang.org/en/documentation/installation/), and then run

```shell
git clone --recursive https://github.com/dododogame/dododogame.github.io.git
cd dododogame.github.io
bundle install # and resolve all errors if there are any
bundle exec jekyll serve
```

Now, visit http://localhost:4000/dododo/ to see the game.

## Install or update the desktop app

You can run the game locally on your Windows / Linux desktop without internet access if you install it as a desktop app.
*MacOS is not supported yet.*
Also, if you want to install the game on a 32-bit machine,
there are no pre-built packages, and you need to [build the app](#build-the-desktop-app) youself.

To install the game on Windows,
first download the zip package for Windows from [releases](https://github.com/dododogame/dododo/releases).
Just extract the contents of the zip file to somewhere you want to install the game, and then
[create a desktop shortcut](https://support.microsoft.com/en-us/office/create-a-desktop-shortcut-for-an-office-program-or-file-9a8df64b-cd87-4700-95cc-4bc3e2a962da)
for the file `launcher.bat`.
There are icon files in the `www/icon` folder,
you may change the icon of the shortcut to the icon of the game.

To install the game on Linux,
first download the tar.gz package for Linux from [releases](https://github.com/dododogame/dododo/releases).
Just extract the tar.gz file to somewhere you want to install the game, and then
create a [desktop entry](https://wiki.archlinux.org/title/desktop_entries) for executing the file `launcher.sh`.
The icon can be specified as the one in the `www/icon` folder.

To update the game, download the www-only version of the released package from
[releases](https://github.com/dododogame/dododo/releases),
and extract the `www` folder in it to replace the `www` folder of the old installed version.

## Build the desktop app

There is a Ruby script to wrap the game into a self-contained web app which can be run using [NW.js](https://nwjs.io/).
To build the desktop app, first [install Ruby](https://www.ruby-lang.org/en/documentation/installation/),
and then run

```shell
git clone https://github.com/dododogame/dododo.git
cd dododo
bundle install # and resolve all errors if there are any
rake build
```

You can build for different platforms (Windows or Linux) and for different architectures (ia32 or x64).
By default, the platform and the architecture are determined according to the OS on which you are building the app.
You may provide additional arguments for `rake build` to specify the platform and the architecture.

Currently, only the script for building for Windows and Linux are provided.
There are indeed NW.js releases for MacOS, but using it to build the app requires the toolchain that is only available on MacOS
(so actually you may try building the app without using the Ruby script if you have a MacBook).
Also, because there are no official releases for NW.js for machines of ARM architecture,
if you want to build the app for ARM architecture,
you need to download the community [NW.js ARM binaries](https://github.com/LeonardLaszlo/nw.js-armv7-binaries)
and specify the downloaded NW.js in the command-line argument `nwjs_path` (see the table below).

Here is a full list of available command-line arguments:

| Argument | Default                                                                                                                  | Available values | Description                                               |
|---------|--------------------------------------------------------------------------------------------------------------------------|------------------|-----------------------------------------------------------|
| `platform` | Determined by your OS                                                                                                    | `win`, `linux`   | The platform to build for                                 |
| `architecture` | Determined by your OS                                                                                                    | `ia32`, `x64`     | The architecture to build for                             |
| `quiet` | `false`                                                                                                                   | `true`, `false` | Whether to supress output                                 |
| `target_path` | `./pkg`                                                                                                                  | Any path | The path to the output directory                          |
| `temp_dir` | `~/.cache/dododo`                                                                                                        | Any path | The directory to store some downloaded or extracted files |
| `nwjs_version` | `0.67.1`                                                                                                                 | Any version | The version of NW.js to use if it is to be downloaded     |
| `nwjs_path` | `$temp_dir/nwjs-v$nwjs_version-$platform-$architecture.<ext>`, where `<ext>` is `tar.gz` or `zip` according to `platform` | Any path | The pre-downloaded NW.js to be used; will download for you if non-exist |
| `www_only` | `false`                                                                                                                  | `true`, `false` | Whether to build only the web files; no NW.js if true |
| `package` | `false` | `true`, `false` | Whether to package the app for distribution after building completes; will create a .tar.gz or .zip file according to `platform` |

For example, to build for 32-bit Windows and create a zip file for distribution, run

```shell
rake build platform=win architecture=ia32 package=true
```

## License

[MIT](https://opensource.org/licenses/MIT)
