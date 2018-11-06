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
