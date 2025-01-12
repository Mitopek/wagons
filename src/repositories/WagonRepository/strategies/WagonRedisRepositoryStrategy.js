class WagonRedisRepositoryStrategy {
  constructor(redisClient, publisher) {
    this.redisClient = redisClient
    this.publisher = publisher
  }

  async createWagon(coasterId, data) {
    const {
      ilosc_miejsc,
      predkosc_wagonu,
    } = data
    await this.redisClient.incr('wagonId')
    const id = await this.redisClient.get('wagonId')
    await this.redisClient.rPush(`coasters:${coasterId}:wagons`, id)
    const newWagon = {
      ilosc_miejsc,
      predkosc_wagonu,
      coasterId,
    }
    await this.redisClient.hSet(`wagon:${id}`, newWagon)
    this.publisher.publish('dataUpdated', JSON.stringify(newWagon))
    return newWagon
  }

  async deleteWagon(coasterId, wagonId) {
    await this.redisClient.del(`wagon:${wagonId}`)
    await this.redisClient.lRem(`coasters:${coasterId}:wagons`, 0, wagonId)
    this.publisher.publish('dataUpdated', JSON.stringify({ wagonId }))
  }

  async getWagon(coasterId, wagonId) {
    return await this.redisClient.hGetAll(`wagon:${wagonId}`)
  }

  async getCoasterWagons(coasterId) {
    const wagonIds = await this.redisClient.lRange(`coasters:${coasterId}:wagons`, 0, -1)
    const wagons = []
    for(const wagonId of wagonIds) {
      const wagon = await this.redisClient.hGetAll(`wagon:${wagonId}`)
      wagons.push(wagon)
    }
    return wagons
  }
}

module.exports = WagonRedisRepositoryStrategy