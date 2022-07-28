const Qstroller = artifacts.require("Qstroller")
const Unitroller = artifacts.require("Unitroller")

const argv = require('yargs').option('comptroller', {string:true})
                             .option('fToken', {string:true})
                             .argv

module.exports = async function(callback) {
    try {
        console.log(`argv> comptroller=${argv.comptroller} fToken=${argv.fToken}, paused=${argv.paused}`)

        let qsControllerInstance = await Qstroller.at(argv.comptroller)
        let allSupportedMarkets = ["0x2b9f49361aB609bA7de1ec8cd6c970cDBb19cA66", "0x42C8A982f42b6069AD310e9910468B593247eace", "0x21c376438dA428F730249aEe27F4454358429974", "0xb064f6336F747b9ECDdAEadA9964E9d123BDB01B", "0x7bC72d7780C2E811814e81FFac828d53f4CDe7c2"];
        allSupportedMarkets = ["0xF31AD464E61118c735E6d3C909e7a42DAA1575A3"]
        // let proxiedQstroller = await Qstroller.at(unitrollerInstance);
        // let allSupportedMarkets = await qsControllerInstance.getAllMarkets();
        for (ftoken of allSupportedMarkets) {
            // await qsControllerInstance._setMintPaused(ftoken, argv.paused)
            // console.log(ftoken, " MintPaused: ", await qsControllerInstance.mintGuardianPaused(ftoken))
            await qsControllerInstance._setBorrowPaused(ftoken, argv.paused)
            console.log(ftoken, " BorrowPaused: ", await qsControllerInstance.borrowGuardianPaused(ftoken))
        }
        // await qsControllerInstance._setTransferPaused(argv.paused)
        console.log("TransferPaused: ", await qsControllerInstance.transferGuardianPaused())

        // await qsControllerInstance._setSeizePaused(argv.paused)
        console.log("SeizePaused: ", await qsControllerInstance.seizeGuardianPaused())

        callback()
    } catch (e) {
        callback(e)
        console.log(e)
    }
}
