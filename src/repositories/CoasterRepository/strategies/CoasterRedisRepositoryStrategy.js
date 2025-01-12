class CoasterRedisRepositoryStrategy {
  constructor(redisClient, publisher) {
    this.redisClient = redisClient
    this.publisher = publisher
  }

  async getCoasters() {
    const coastersIds = await this.redisClient.lRange('coasters', 0, -1);
    const coasters = []
    for (const coasterId of coastersIds) {
      const coaster = await this.redisClient.hGetAll(`coaster:${coasterId}`);
      coasters.push(coaster)
    }
    return coasters
  }

  async createCoaster(data) {
    const {liczba_personelu, liczba_klientow, dl_trasy, godziny_od, godziny_do } = data;
    await this.redisClient.incr('coasterId');
    const id = await this.redisClient.get('coasterId');
    await this.redisClient.rPush(`coasters`, id);
    const newCoaster = {
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    }
    await this.redisClient.hSet(`coaster:${id}`, newCoaster);
    this.publisher.publish('dataUpdated', JSON.stringify(newCoaster))
    return newCoaster
  }

  async updateCoaster(coasterId, data) {
    const {liczba_personelu, liczba_klientow, dl_trasy, godziny_od, godziny_do } = data;
    const coaster = {
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    }
    await this.redisClient.hSet(`coaster:${coasterId}`, coaster);
    this.publisher.publish('dataUpdated', JSON.stringify(coaster))
    return coaster
  }

  async getCoaster(coasterId) {
    return await this.redisClient.hGetAll(`coaster:${coasterId}`);
  }
}

module.exports = CoasterRedisRepositoryStrategy;