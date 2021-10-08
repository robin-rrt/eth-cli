## eth-cli

This is a CLI CBG uses internally to do things like automated airdrops for workshops.

## Usage

1. clone this repo
2. `yarn install`
3. run `yarn run-command <subcommand> [ARGS] [OPTIONS]`. e.g. `yarn run-command generateSigner`

## Commands

### `generateSigner`

Generates new keys and puts their mnemonic in a file called `.signer`. Overridable with the `-o` flag.

Args: None

Options:
* `-o, --outfile <outfile>` (optional) - output file to put the signer mnemonic
* `-f, --force` (optional) - force overwrite existing signer mnemonic file

### `sendBatch <amount> <address-csv-file>`

Sends `amount` of the current network's native token to every address in `address-csv-file`.

Args:
* `amount` - amount of native token to send to each address, in full denomination (i.e. ETH, MATIC, etc)
* `address-csv-file` - path to a csv file with at a column titled "Ethereum Address" whose values are address hex strings. The file can have other columns too - the command will simply ignore them.

Options:
* `-s, --signer <signer-file>` (required) - file containing the mnemonic of the address to send transactions from
* `-n, --network <network>` (optional) - name of the network to use. Defaults to 'mainnet'. Currently supported values are:
    * 'mainnet' - ethereum mainnet
    * 'polygon-mainnet' - polygon mainnet