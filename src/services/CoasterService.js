class CoasterService {
  constructor(coasterRedisRepository, coasterLocalRepository, loggerService) {
    this.coasterRedisRepository = coasterRedisRepository
    this.coasterLocalRepository = coasterLocalRepository
    this.loggerService = loggerService
  }

  async syncCoasters() {
    try {
      const coasters = await this.coasterLocalRepository.getCoasters()
      for (const coaster of coasters) {
        const existingCoaster = await this.coasterRedisRepository.getCoaster(coaster.id)
        if (existingCoaster) {
          await this.coasterRedisRepository.updateCoaster(coaster.id, coaster)
        } else {
          await this.coasterRedisRepository.createCoaster(coaster)
        }
      }
    } catch (error) {
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async createCoaster(data) {
    await this.coasterLocalRepository.createCoaster(data)
    try {
      await this.coasterRedisRepository.createCoaster(data)
    } catch (error) {
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async updateCoaster(coasterId, data) {
    await this.coasterLocalRepository.updateCoaster(coasterId, data)
    try {
      await this.coasterRedisRepository.updateCoaster(coasterId, data)
    } catch (error) {
      this.loggerService.warn('Nie udało się zsynchronizować z Redisem')
    }
  }

  async getCoasters() {
    try {
      return await this.coasterRedisRepository.getCoasters()
    } catch (error) {
      console.info(error)
      this.loggerService.warn('Redis niedostępny. Pobieranie danych lokalnych.')
      return await this.coasterLocalRepository.getCoasters()
    }
  }
}

module.exports = CoasterService;