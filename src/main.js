const express = require('express')
const redis = require('redis')
const app = express()
const dotenv = require('dotenv');
const CoasterRedisRepositoryStrategy = require('./repositories/CoasterRepository/strategies/CoasterRedisRepositoryStrategy')
const CoasterLocalRepositoryStrategy = require('./repositories/CoasterRepository/strategies/CoasterLocalRepositoryStrategy')
const WagonRedisRepositoryStrategy = require('./repositories/WagonRepository/strategies/WagonRedisRepositoryStrategy')
const WagonLocalRepositoryStrategy = require('./repositories/WagonRepository/strategies/WagonLocalRepositoryStrategy')
const CoasterController = require('./controllers/CoasterController')
const WagonController = require('./controllers/WagonController')
const CoasterService = require('./services/CoasterService')
const WagonService = require('./services/WagonService')
const CoasterSystemService = require('./services/CoasterSystemService')
const LoggerService = require('./services/LoggerService')
const LeaderRedisService = require('./services/LeaderRedisService')
const RedisService = require('./services/RedisService')
const runTasksOnStart = require('./setup/runTasksOnStart')
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const apiRouter = express.Router()
const port =  process.env.PORT || 3050

const loggerService = new LoggerService()
const redisService = new RedisService()
const leaderRedisService = new LeaderRedisService(redisService.getRedisClient(), loggerService)

const coasterRedisRepository = new CoasterRedisRepositoryStrategy(redisService.getRedisClient(), redisService.getPublisher())
const coasterLocalRepository = new CoasterLocalRepositoryStrategy()
const wagonRedisRepository = new WagonRedisRepositoryStrategy(redisService.getRedisClient(), redisService.getPublisher())
const wagonLocalRepository = new WagonLocalRepositoryStrategy()

const coasterService = new CoasterService(coasterRedisRepository, coasterLocalRepository, loggerService)
const wagonService = new WagonService(wagonRedisRepository, wagonLocalRepository, loggerService)

const coasterSystemService = new CoasterSystemService(coasterService, wagonService, loggerService, redisService.getSubscriber(), leaderRedisService, redisService)

const coasterController = new CoasterController(coasterService, coasterSystemService)
const wagonController = new WagonController(wagonService, coasterSystemService)

apiRouter.post('/coasters', coasterController.createCoaster.bind(coasterController))

apiRouter.put('/coasters/:coasterId', coasterController.updateCoaster.bind(coasterController))

apiRouter.post('/coasters/:coasterId/wagons', wagonController.createWagon.bind(wagonController))

apiRouter.delete('/coasters/:coasterId/wagons/:wagonId', wagonController.deleteWagon.bind(wagonController))

app.use('/api', apiRouter)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

runTasksOnStart(coasterSystemService)