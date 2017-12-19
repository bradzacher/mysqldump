import main from '../../src/main'
import testConfig from '../testConfig'

// entry point for vs-code launch.json runs
(async () => {
    try {
        const res = await main({
            connection: testConfig,
            dumpToFile: `${__dirname}/../launch_dump.sql`,
        })

        console.info(res.dump.schema)
        console.info(res.dump.data)
    } catch (e) {
        console.error(e)
    }
})()
