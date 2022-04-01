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

To set a universal offset, select "Offset wizard" in the preferences.
Then, you will start playing a very simple beatmap.
Just feel the rhythm by your heart and hit the spacebar.
After you finish playing the beatmap, the game will adjust the offset automatically for you.
If you are not satisfied with the new offset, you can repeat these steps.

Alternatively, you can set the offset without using the offset wizard.
You can directly set it in the preferences.

Note that after you refresh the webpage, the set offset will be cleared,
and you will need to set it again.

## Game mechanics

In this section, a detailed illustration of the process of gameplay is delivered.

### Notes

**Note**s are the most essential part of the gameplay.

There are two types of notes in Dododo, **click**s and **hold**s.

To hit a note, you should hit a key on the keyboard (on a device with a keyboard)
or touch the screen (on a device with a touchable screen)
within the time at which it should be hit (when the [judge line](#judge-line) meets the note)
plus or minus the inaccuracy tolerance.

There are three levels of inaccuracies: perfect, good, and bad.
Their judge intervals are to be specified in the beatmap and can change throughout the gameplay.
If a note fails to be hit, it is a miss judge.
The number of perfects, goods, bads, and misses affect the [score](#score).

Specially, to hit a hold, throughout its sustaining time
(until its end time minus the inaccuracy tolerance of good judge),
there should be at least one key/touch being pressed.
If there are multiple holds sustaining at the same time,
there should also be multiple keys/touches being pressed at the same time.

At first, notes are colored white.
After a note is cleared (hit or missed), the note will be re-colored.
Perfect is yellow; good is blue; bad is green; miss is red.
After a note is hit, there will appear an indicator in the [inaccuracy bar](#inaccuracy-bar).

If a hit cannot correspond to any notes, it is regarded as an excess hit,
which also affects the [score](#score) and the [combo](#combo).

### Bar lines

**Bar line**s are vertical lines as auxiliaries for reading the beatmap.
They are an imitation of bar lines from sheet music.
They can also be used to ornament the beatmap.
They themselves do not affect the gameplay.

### Judge line

The judge line (or scan line) moves throughout the gameplay.
The perfect time for the player to hit a note is exactly
when the judge line moves to a position at the center of the note.

The speed of the judge line can change throughout the gameplay,
but its speed must be constant within a line.

### Inaccuracy bar

The inaccuracy bar is to help indicate how inaccurate the notes are hit.
It is located at the bottom of the gameplay interface.
It is colored symmetrically, with the perfect judge interval being yellow,
the good judge interval being blue, and the bad judge interval being green.
Note that the inaccuracy tolerance is specific to different beatmaps,
and it can even change during the gameplay.

When a note is hit, according to the inaccuracy,
a small rule will appear at the inaccuracy bar.
The more early it is hit, the more left the small rule will be to.
The small rule then fades out.
With an exact perfect hit, the small rule will appear at the very center of the inaccuracy bar.

Any inaccuracy out of the bad judge interval
will not cause a small rule to appear at the inaccuracy bar.

### Combo

Combo refers to the number of consecutive notes the player hits.
It is shown in the bottom-left corner of the gameplay interface.

There are two cases when the combo is interrupted and reset to 0:

- During the time at which a note should be hit plus or minus the good judge interval,
the note is not hit. In other words, a note is badded or missed.
- A key that can possibly be the key of a note is hit mistakenly.
In other words, during the time at which a key is hit plus or minus the bad judge interval,
there are no notes corresponding to the key.

After a gameplay is finished, an FC (full combo) note will appear next to the combo number
if the combo has never been reset during the gameplay.

### Score

The game will assign you a score based on your performance in playing a beatmap.
The score is shown dynamically during the gameplay at the up-right corner of the gameplay interface.
The calculation of the score involves the number of perfects, goods, bads, misses, and excesses:

```js
Score = 1000000 * (perfect + good/4 - excess) / notesCount;
```

Unlike some (or most) rhythm games, Dododo does not take combo into account when scoring.

Once a gameplay is finished (the judge line reaches the end of the beat map),
a mark will be calculated and shown in the bottom-right corner of the gameplay interface.
The mark is a letter. The mark scale is

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

A Dododo beatmap is a `.ddd` file in plain-text format.
The beatmap consists of two parts, the **head** and the list of **row**s.
The two parts are separated by a single `---` line.

The following are just some specifications.

### Head

The head consists of several key-value pairs, each of which lies in a line,
and a key is separated from its corresponding value by `: ` (a colon and a whitespace).

The following items are available:

#### `title`

The name of the music.

This item should always be specified to a simple, short, unique, direct string
so that users can identify the music quickly.

#### `musicAuthor`

The author of the music (the artist).

The first name and middle name of the author can
be abbreviated as their initial letters for brevity.
If there are multiple authors,
it is recommended to specify them all and connect the names with `&`.
If multiple authors contribute in different ways to composing the music
(composers, lyricists, players, etc.),
it is recommended to specify such information in parentheses.
For example, `W. A. Mozart (Composer) & S. Ligoratti (Player)`.

#### `beatmapAuthor`

The author of the beatmap.

You may use your nickname.

#### `difficulty`

The difficulty of the beatmap.

It is usually specified as an integer ranging from 1 to 15.
If it is not specified, the difficulty would be "unknown" (without the quotes).
Though not recommended, you can specify the difficulty as
numbers greater than 15 or "???" for extremely hard beatmaps.

Difficulty is intended to be a brief indicator on an ordinal scale
of how hard the beatmap is to beat.
You can refer to [the store](https://github.com/ulysseszh/typhm_store/)
to see how hard on earth a certain difficulty is.

#### `audioUrl`

The url of the audio file of the music.

If it is no specified, the user have to upload an audio
(if playing through uploading files),
or the user will not hear any music when playing.

#### `start`

Where to start playing the audio file, in milliseconds.

If it is not specified, the audio file will be played from its very beginning.

In some cases, the audio file used as the music is too long for a rhythm game,
and it cannot be modified easily if it is provided through a url.
Then, you may have to specify a certain portion (segment) of the audio file.
The items `start` and [`end`](#end) offers you the function.

#### `end`

Where to end playing the audio file, in milliseconds.

If it is not specified, the audio file will be played until its very end.
Despite that, you should always specify this item in your beatmap
to prevent the game preloading the metadata of the audio file
(for calculating the length) to increase its performance.

#### `volume`

The volume for playing the audio file. `1.0` means original volume.

It is intended to be used when the audio file is provided through a url
because the file cannot be modified in that case.

#### `offset`

The time (position) in the played audio at which the beatmap starts.
Should be positive.

It is different from `start` in that the audio before `offset` will be played.
Note that, if `start` and `offset` are both specified,
audio starts playing at `start` while the beatmap starts at `start + offset`.

### Rows

Different **row**s in the beatmap are separated by an empty line.
Do not include empty lines within a row.

Every row consists of one or several **voice**s.
Each voice consists of several **note**s and **bar line**s and is written within a line.
Every note is specified by its note length and multiplicity (simultaneous note in the same voice)
together with symbols denoting whether the note is hold, tied, beamed, etc.

#### Control sentences

Before specifying the notes in a row, some control sentences can be included for the row.
Each control sentence includes a function name and one or more parameters,
separated by spaces.
The function name must start with a capitalized letter, and the rest letters are case-insensitive.

Here is some function names and the corresponding parameters.

##### `PERFECT`, `GOOD`, `BAD`

Syntax:

```text
PERFECT <interval>
GOOD <interval>
BAD <interval>
```

These control sentences accept one parameter, indicating the judging interval.
The `interval` is NOT in milliseconds but is the ratio of the maximum accepted distance between
the judge line and the note to be hit for a perfect / good / bad judge and the total (spatial) length of the row.
Therefore, judging will be stricter if the judging line moves faster.

##### `BPM`

Syntax:

```text
BPM <beatNoteLength> <beatsPerMinute>
```

The `beatNoteLength` is a character denoting the note length of the beat note.
See [how to write a note](#how-to-write-a-note) to know how to specify a note length.
The `beatsPerMinute` is the number of beats per minute,
meaning that one minute is exactly `beatsPerMinute` times as long as the beat note.

#### How to write a note

The syntax of a note is:

```text
<noteLength><dots><multiplicity><hold><tied>
```

| Element        | Possible value (Regexp) | Meaning                                                                  |
|----------------|-------------------------|--------------------------------------------------------------------------|
| `noteLength`   | `[0-9a-z]`              | The note length (without of augmentation dots)                           |
| `dots`         | `\.*`                   | The number of augmentation dots (as many as the number written here)     |
| `multiplicity` | `[0-9a-z]?`             | The multiplicity (number of simultaneous notes) (default 1 if omitted)   |
| `hold`         | `_?`                    | Whether the note is a hold (omitted underscore means a click)            |
| `tied`         | `~?`                    | Whether the note is tied (connected to the next note) (tilde means tied) |

Here the `noteLength` and the `multiplicity` are specified by a single character representing a number.
0–9 are just literally 0–9, and a–z are 10–35 respectively.

The `noteLength` value represents the log2 of the ratio of
the time length of a whole note and that of the specified note. 

The `multiplicity` value represents the number of simultaneous notes in the voices.
A zero multiplicity means that the note is a rest.

Because there are totally 10 digits and 26 letters,
the shortest possible note is `2**35`th note,
and the largest multiplicity is `2**35`.

If a note's previous note is tied to this note, this note's `multiplicity` and `hold`
are useless and are kept consistent with the previous note.

#### Making notes beamed or grouping (contrametric)

Notes can be **beam**ed (flags are connected) by enclosing them with parentheses.
Parenthesized notes without flags will not be beamed.

Beams can be created across bar lines (by inserting `|` between beamed notes)
but not across rows or voices.

**Grouping**s (tuplets) can be created by specifying a ratio after the closing parenthesis.
The ratio consists of two characters, each of which is within `[0-9a-z]` representing a number.
The first number divided by the second number is
the ratio of the seeming length of the grouping and the actual length of the grouping.
The second number can be omitted, and the default value of it is
`2**(floor(log2(ratio1)))/ratio1`, where `ratio1` is the first number.

Here is an example of some notes and the rhythm they represents.

```text
2 (3 3 3)3 2 (4 4 4 4 4)5 | 2
```
![\new RhythmicStaff {
\clef percussion
\time 4/4
\set Score.tempoHideNote = ##t \tempo 4 = 80
c4 \tuplet 3/2 { c8 c c }
c4 \tuplet 5/4 { c16 c c c c }
c4
}](https://upload.wikimedia.org/score/1/e/1ea3xyusyw770pzh5dli2ezzv76si3k/1ea3xyus.png)

#### Writing bar lines

Bar lines are created by inserting a `|` (and spaces for separating it from notes) within a voice.
They can appear within a beamed group of notes.
They can also appear between two tied notes.
It is recommended to write a bar line at the end of each voice.

Every bar line will extend all across the voices in the row
but not just the voice where it is written.
