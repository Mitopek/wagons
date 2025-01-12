class WagonService {
  constructor(wagonRedisRepository, wagonLocalRepository, loggerService) {
    this.wagonRedisRepository = wagonRedisRepository
    this.wagonLocalRepository = wagonLocalRepository
    this.loggerService = loggerService
  }

  async syncWagons() {
    try {
      const wagons = await this.wagonLocalRepository.getWagons()
      for (const wagon of wagons) {
        const existingWagon = await this.wagonRedisRepository.getWagon(wagon.coasterId, wagon.id)
        if (!existingWagon) {
          await this.wagonRedisRepository.createWagon(wagon.coasterId, wagon)
        }
      }
    } catch (error) {
      console.info(error)
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async createWagon(coasterId, data) {
    await this.wagonLocalRepository.createWagon(coasterId, data)
    try {
      await this.wagonRedisRepository.createWagon(coasterId, data)
    } catch (error) {
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async deleteWagon(coasterId, wagonId) {
    await this.wagonLocalRepository.deleteWagon(coasterId, wagonId)
    try {
      await this.wagonRedisRepository.deleteWagon(coasterId, wagonId)
    } catch (error) {
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async getCoasterWagons(coasterId) {
    try {
      return await this.wagonRedisRepository.getCoasterWagons(coasterId)
    } catch (error) {
      console.info(error)
      this.loggerService.warn('Redis niedostępny. Pobieranie danych lokalnych.')
      return await this.wagonLocalRepository.getCoasterWagons(coasterId)
    }
  }
}

module.exports = WagonService;

