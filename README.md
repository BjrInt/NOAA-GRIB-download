# What's this ?
I was looking for a quick and simple way to download NOAA [GRIB files](https://en.wikipedia.org/wiki/GRIB) using JavaScript.

I stumbled upon [this page](http://www.cpc.ncep.noaa.gov/products/wesley/fast_downloading_grib.html) stating `If You are Lucky, it is Simple`. TL;DR: It's just a NodeJS rewrite. It does not require cURL and has many default argument to work out of the box.

## Tools
### CLI
The CLI is basically the equivalent of [get_gfs.pl](ftp://ftp.cpc.ncep.noaa.gov/wd51we/fast_downloading_grib/get_gfs.pl). It is more meant as a prototyping tool than a full-blown interface. Running
```
node cli.js
```
wil give you the list of available command and arguments. The most useful one is `download`.
#### Examples

```
node cli.js download -g pres -f 0-48 -j
```
Download next 48 hours forecast (following most recent model run) for a couple of pressure KPI, and dump the result using eccodes.



```
node cli.js download -s wave -f 0,6
```
Download the U-/V- component of wind grids, surface lvl (default grid) from the WAVE model (not GFS) at present time AND in 6 hours.



```
node cli.js get-inventory -i ncep
```
Get the inventory for the most recent GFS run and replaces VARS with their plaintext equivalent stored in user defined tables. This is useful if you need to know what species are listed in a given inventory.

### End2End (lib/e2e.js)

If you need to download GRIB files programmatically you'll most probably need to use the end to end function. It is a wrapper around the inventory and range-download query which gives you a single-hit download option.

#### Example
```
const end2end = require('./lib/e2e.js')
const GFS = require('./lib/models/GFS.json')

e2e(GFS,
    ['PRES:surface', 'MSLET:mean sea','HGT:surface'],
    '2012121200',
    '0-24',
    {})
```

#### API
```
void e2e(model, grids, date, forecastRange, options)
```

| Argument   |      Description      | Example
|----------| ------------- |
| model | A JSON containing the model description, models are located in the `lib/models` directory | (see lib/models/GFS.json for example) |
| grids | An array containing the grids to fetch in the inventory   | `['UGRD:10 m', 'VGRD:10 m']` will give you U and V component of wind at 10m above ground |
| date | A `YYYYMMDD` or `YYYYMMDDHH` string. If HH is not specified, fallbacks to 00h. | `2018010100` January 1st, 2018 at 00h00 UTC |
| forecast | A forecast range, downloads every available forecast within that range <br> * x-y -> x TO y hours ahead<br> * x,y -> x AND y hours ahead<br> * x -> x hours ahead | |

# Dependencies

## Dumping to JSON (eccodes)
In order to dump grib file to JSON you will need a clean install of [eccodes tools](https://confluence.ecmwf.int/display/ECC). On some linux distro it could be as easy as
```
sudo apt-get install libeccodes-tools
```
... might be trickier on Windows though 🤔.

## [optional] Testing (Jest)
You don't need to install the node dependencies, unless you want to unit test the lib.
```
# install dependencies (run once)
yarn
# or
npm i

# run tests
yarn test
# or
npm run test
```
The test suite is an easy way to check your eccodes installation as well.
