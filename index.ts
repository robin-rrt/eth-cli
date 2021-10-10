import { program } from 'commander';
import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import * as ethers from 'ethers';

const POLYGON_NODE_URL = "https://speedy-nodes-nyc.moralis.io/492c808ff04c365f5bea8bb5/polygon/mainnet";
const RINKEBY_NODE_URL = "https://speedy-nodes-nyc.moralis.io/744601fb038cdc8a5aafd8bc/eth/rinkeby";
const KOVAN_NODE_URL = "https://speedy-nodes-nyc.moralis.io/744601fb038cdc8a5aafd8bc/eth/kovan";

function getProvider(network?: string) {
	network = network ?? 'mainnet';
	switch (network) {
		case 'polygon-mainnet':
			return new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
		case 'mainnet':
			return ethers.getDefaultProvider();
		case 'rinkeby':
			return new ethers.providers.JsonRpcProvider(RINKEBY_NODE_URL);
		case 'kovan':
			return new ethers.providers.JsonRpcProvider(KOVAN_NODE_URL);
		default:
			console.error(`Unknown network '${network}'`);
			throw new Error()
	}
}

function loadFromMnemonic(path: string, network?: string) {
	const mnemonicStr = fs.readFileSync(path).toString();
	const mnemonic = JSON.parse(mnemonicStr);
	const wallet = ethers.Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
	const provider = getProvider(network);
	return wallet.connect(provider);
}

async function main() {
	program
		.command('sendBatch <amount> <address-csv-file>')
		.requiredOption('-s, --signer <path>', 'path to file contining mnemonic for signer')
		.option("-n, --network <network-name>', 'network to connect to. Currently only supports 'mainnet' and 'polygon-mainnet'")
		.description('send <amount> to every address in <address-csv-file>')
		.action(async (amount, addresses_path, options) => {
			const signer = loadFromMnemonic(options.signer, options.network);

			const csvStr = fs.readFileSync(addresses_path).toString();
			const addresses: string[] = parse(csvStr, { columns: true, skip_empty_lines: true }).map((row: any) => row['Ethereum Address']);

			const sendAmount = ethers.utils.parseEther(amount);
			const nonceOffset = await signer.getTransactionCount();
			const txResponses = await Promise.all(addresses.map(
				(addr, i) => signer.sendTransaction({ to: addr, value: sendAmount, nonce: nonceOffset + i })
			));

			await Promise.all(txResponses.map(res => res.wait()));
		});

	program
		.command('generateSigner')
		.option('-o, --outfile <path>', 'output file path')
		.option('-f, --force', 'force existing mnemonic file to be overwritten')
		.description('generate a new signer and output to .signers/.signer. path is overridable with -o')
		.action((options) => {
			const path = options.outfile ?? './.signer';

			// check to make sure path exists and exit if it does and override flag isn't given
			if (!options.force && fs.existsSync(path)) {
				console.error(`Mnemonic file already exists at '${path}' - overwriting it will result in the loss of all its funds.`);
				console.error("If you're sure you want to overwrite the file, use '--force'.");
				throw new Error();
			}

			const signer = ethers.Wallet.createRandom();
			console.log('created account with address', signer.address);
			const mnemonic = signer.mnemonic;
			fs.writeFileSync(path, JSON.stringify(mnemonic))
		});

	try {
		await program.parseAsync(process.argv);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}

}

main();
