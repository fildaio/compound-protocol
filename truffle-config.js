/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */
const wrapProvider = require('arb-ethers-web3-bridge').wrapProvider
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8645,            // Standard Ethereum port (default: none)
     network_id: "20",       // Any network (default: none)
    //  gas: 8000000,
     gasPrice: 3000000000,
    },
    elalocal: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      gas: 8000000
    },
    ethlocal: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      gas: 8000000
    },

    // Another network with more advanced options...
    // advanced: {
      // port: 8777,             // Custom port
      // network_id: 1342,       // Custom network
      // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
      // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
      // from: <address>,        // Account to send txs from (default: accounts[0])
      // websockets: true        // Enable EventEmitter interface for web3 (default: false)
    // },

    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/98520c87aac949ac9c2310084b2d48b8`),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },

    // Useful for private networks
    // private: {
      // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
      // network_id: 2111,   // This network is yours, in the cloud.
      // production: true    // Treats this network as if it was a public net. (default: false)
    // }

      elatest: {
          provider: () => new HDWalletProvider(mnemonic, `https://rpc.elaeth.io`),
          network_id: 21,
          production: false,
          timeoutBlocks: 200,
          skipDryRun: true,
          networkCheckTimeout: 100000000
      },

      elaeth: {
          provider: () => new HDWalletProvider(mnemonic, `https://api.trinity-tech.io/esc`),
          network_id: "20",   // This network is yours, in the cloud.
          timeoutBlocks: 200,
          confirmations: 2,
          gasPrice: 5000000000,
          skipDryRun: true,
          websockets: true,
          networkCheckTimeout: 100000000
      },

    escfork: {
        provider: () => new HDWalletProvider(mnemonic, `https://testnode.filda.org`),
        network_id: "20",   // This network is yours, in the cloud.
        timeoutBlocks: 200,
        confirmations: 2,
        gasPrice: 5000000000,
        skipDryRun: true,
        websockets: true,
        networkCheckTimeout: 100000000
    },
    localesc: {
      provider: () => new HDWalletProvider(mnemonic, `http://127.0.0.1:8545`),
      network_id: "20",   // This network is yours, in the cloud.
      timeoutBlocks: 200,
      confirmations: 2,
      gasPrice: 5000000000,
      skipDryRun: true,
      networkCheckTimeout: 100000000
  },

      hecotest: {
          provider: () => new HDWalletProvider(mnemonic, `wss://ws-testnet.hecochain.com`),
          network_id: "256",
          timeoutBlocks: 200,
          confirmations: 2,
          gasPrice: 2000000000,
          skipDryRun: true,
          networkCheckTimeout: 100000000,
          websockets: true
      },

      heco: {
          // provider: () => new HDWalletProvider(mnemonic, `https://heconode.ifoobar.com`),
          provider: () => new HDWalletProvider(mnemonic, `https://rpc.ankr.com/heco/90a7bf353c5a5a8f00d751c6e6814b1ba7887559556f30f6f1b424ff76425d56`),
          network_id: "128",   // This network is yours, in the cloud.
          timeoutBlocks: 200,
          confirmations: 2,
          gasPrice: 2500000000,
          skipDryRun: true,
          networkCheckTimeout: 100000000,
          //websockets: true
      },

      arbitrum: {
          provider: () => wrapProvider(new HDWalletProvider(mnemonic, `wss://arb1.arbitrum.io/ws`)),
          //network_id: "42161",   // This network is yours, in the cloud.
          network_id: '*',
          timeoutBlocks: 200,
          confirmations: 2,
          //gasPrice: 2000000000,
          gasPrice: 0,
          skipDryRun: true,
          networkCheckTimeout: 600000000,
          websockets: true,
          gas: 800000000
      },

      arbitrumtest: {
          provider: () => wrapProvider(new HDWalletProvider(mnemonic, `wss://rinkeby.arbitrum.io/ws`)),
          network_id: '*',//421611
          timeoutBlocks: 200,
          confirmations: 2,
          gasPrice: 0,
          skipDryRun: true,
          networkCheckTimeout: 600000000,
          websockets: true,
          gas: 800000000
      },

      bsctest: {
          provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-2-s3.binance.org:8545/`),
          network_id: "97",
          timeoutBlocks: 600,
          //confirmations: 2,
          gasPrice: 10000000000,
          skipDryRun: false,
          networkCheckTimeout: 600000000,
          websockets: true
      },
      bsc: {
          // provider: () => new HDWalletProvider(mnemonic, `wss://speedy-nodes-nyc.moralis.io/50d91e85ea901f0b2e54edeb/bsc/mainnet/ws`),
          //provider: () => new HDWalletProvider(mnemonic, `https://bsc-dataseed1.defibit.io/`),
          provider: () => new HDWalletProvider(mnemonic, `https://bscnode.filda.io`),
          network_id: "56",
          timeoutBlocks: 600,
          //confirmations: 2,
          gasPrice: 10000000000,
          skipDryRun: false,
          networkCheckTimeout: 600000000,
          websockets: true
      },
      matictest: {
          provider: () => new HDWalletProvider(mnemonic, `wss://ws-matic-mumbai.chainstacklabs.com`),
          network_id: "80001",
          timeoutBlocks: 600,
          //confirmations: 2,
          gasPrice: 5000000000,
          skipDryRun: false,
          networkCheckTimeout: 600000000,
          websockets: true
      },
      matic: {
          // provider: () => new HDWalletProvider(mnemonic, `wss://rpc-mainnet.matic.quiknode.pro`),
          provider: () => new HDWalletProvider(mnemonic, `https://matic-mainnet.chainstacklabs.com`),
          network_id: "137",
          chain_id: "137",
          timeoutBlocks: 60,
          //confirmations: 2,
          gasPrice: 1237433976546,
          skipDryRun: false,
          networkCheckTimeout: 100000,
          // websockets: true
      },
      IoTeXTest: {
        // provider: () => new HDWalletProvider(mnemonic, `https://babel-api.testnet.iotex.io`),
        provider: () => new HDWalletProvider(mnemonic, `wss://babel-api.testnet.iotex.io`),
        network_id: "4690",
        chain_id: "4690",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 1000000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: false
      },
      IoTeX: {
        // provider: () => new HDWalletProvider(mnemonic, `https://babel-api.mainnet.iotex.one`),
        provider: () => new HDWalletProvider(mnemonic, `https://babel-api.mainnet.iotex.io`),
        // provider: () => new HDWalletProvider(mnemonic, `https://rpc.ankr.com/iotex`),
        // provider: () => new HDWalletProvider(mnemonic, `wss://babel-api.mainnet.iotex.io`),
        // provider: () => new HDWalletProvider(mnemonic, `https://iotexnode.filda.io`),
        network_id: "4689",
        chain_id: "4689",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 1000000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: true
      },
      auroratest: {
        // provider: () => new HDWalletProvider(mnemonic, `https://testnet.aurora.dev`),
        provider: () => new HDWalletProvider(mnemonic, `wss://testnet.aurora.dev`),
        network_id: "1313161555",
        chain_id: "1313161555",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 1,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: true
      },
      aurora: {
        // provider: () => new HDWalletProvider(mnemonic, `https://testnet.aurora.dev`),
        provider: () => new HDWalletProvider(mnemonic, `wss://mainnet.aurora.dev`),
        network_id: "1313161554",
        chain_id: "1313161554",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 0,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: true
      },
      rei: {
        provider: () => new HDWalletProvider(mnemonic, `wss://rpc.rei.network/`),
        network_id: "47805",
        chain_id: "47805",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 10000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: true
      },
      bttcTest: {
        provider: () => new HDWalletProvider(mnemonic, `https://pre-rpc.bt.io/`),
        network_id: "1029",
        chain_id: "1029",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 15000000000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: false
      },
      bttc: {
        provider: () => new HDWalletProvider(mnemonic, `https://bttc.trongrid.io`),
        network_id: "199",
        chain_id: "199",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 300000000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: false
      },
      kavaTest: {
        provider: () => new HDWalletProvider(mnemonic, `https://evm.testnet.kava.io`),
        network_id: "2221",
        chain_id: "2221",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 1000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: false
      },
      kava: {
        provider: () => new HDWalletProvider(mnemonic, `https://evm.kava.io`),
        network_id: "2222",
        chain_id: "2222",
        timeoutBlocks: 60,
        //confirmations: 2,
        gas: 8000000,
        gasPrice: 1000000000,
        skipDryRun: false,
        networkCheckTimeout: 600000000,
        websockets: false
      },
  },
  plugins: ["truffle-contract-size"],

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  plugins: [
    'truffle-contract-size'
  ],

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.16",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 20
       },
      //  evmVersion: "byzantium"
      }
    }
  }
}
