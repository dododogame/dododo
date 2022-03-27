# Dododo

A rhythm game with musical rhythm notations!

Get access to the game through [the webpage](https://ulysseszh.github.io/rpg/dododo/).

## How to play

There are 3 ways in which you can start playing,
each of which starts with providing the game with a **beatmap** (or chart).

### Playing through uploading files

You need to upload a beatmap from your file system.

You can also specify an audio file for the music.
If there is no audio file specified, the game will use that specified by
[`audioUrl`](#audiourl) in the [head](#head) of the beatmap.

### Playing through browsing the store

(Under development)

### Playing through selecting from history

(Under development)

## How to adjust beatmap offset

Sometimes, you may find that the music and the beatmap is not perfectly synchronized.
In this case, you need to set a universal offset to cancel this effect.

The offset wizard is under development.

Alternatively, you can set the offset without using the offset wizard.
You can directly set it in the preferences.

Note that after you refresh the webpage, the set offset will be cleared,
and you will need to set it again.

## Game mechanics

In this section, a detailed illustration of the process of gameplay is delivered.

### Notes

TODO

### Judge line

TODO

### Inaccuracy bar

TODO

### Combo

TODO

### Score

TODO

Score = 1000000 * (perfect + good/4 - excess) / notesCount.

| Mark | Score      |
|------|------------|
| P    | = 1000000  |
| S    | \>= 950000 |
| A    | \>= 900000 |
| B    | \>= 800000 |
| C    | \>= 700000 |
| D    | \>= 600000 |
| E    | \>= 500000 |
| F    | else       |

## How to compose a beatmap

TODO
