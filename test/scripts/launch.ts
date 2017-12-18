import main from '../../src/main'
import testConfig from '../testConfig'

// entry point for vs-code launch.json runs
(async () => {
    try {
        const res = await main({
            connection: testConfig,
        })

        console.log(res.dump.schema)
        console.log(res.dump.data)
    } catch (e) {
        console.log(e)
    }
})()
