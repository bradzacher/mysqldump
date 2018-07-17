import main from '../../src/main'
import testConfig from '../testConfig'

// entry point for vs-code launch.json runs
(async () => {
    try {
        const res = await main({
            connection: testConfig,
            dump: {
                data: {
                    returnFromFunction: true,
                },
            },
            dumpToFile: `${__dirname}/../launch_dump.sql`,
        })

        console.info(res.dump.schema)
        console.info(res.dump.data)
        console.info(res.dump.trigger)
    } catch (e) {
        console.error(e)
    }
})()
