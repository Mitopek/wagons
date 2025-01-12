const redis = require('redis')

class RedisService {
  redisConnection = {
    socket: {
      host: 'localhost',
      port: 6379
    }
  }
  redisClient
  publisher
  subscriber
  isRedisConnected = false

  constructor() {
    this.redisClient = redis.createClient(this.redisConnection)
    this.publisher = redis.createClient(this.redisConnection)
    this.subscriber = redis.createClient(this.redisConnection)
    this.redisClient.connect()
    this.publisher.connect()
    this.subscriber.connect()
    this.redisClient.on('connect', () => this.isRedisConnected = true)
  }

  getRedisClient() {
    return this.redisClient
  }

  getPublisher() {
    return this.publisher
  }

  getSubscriber() {
    return this.subscriber
  }

  getIsRedisConnected() {
    return this.isRedisConnected
  }
}

module.exports = RedisService