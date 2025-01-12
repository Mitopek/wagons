const TimeService = require('./TimeService')

class CoasterSystemService {
  constructor(coasterService, wagonService, loggerService, subscriber, leaderRedisService, redisService) {
    this.coasterService = coasterService;
    this.wagonService = wagonService;
    this.loggerService = loggerService;
    this.subscriber = subscriber;
    this.leaderRedisService = leaderRedisService;
    this.redisService = redisService;
  }

  breakTimeInMinutes = 1000 * 60 * 5
  personPerCoaster = 1
  personPerWagon = 2
  defaultAverageClientsPerWagon = 32
  timeService = new TimeService()

  async syncData() {
    await this.coasterService.syncCoasters()
    await this.wagonService.syncWagons()
  }

  async start() {
    await this.leaderRedisService.tryToBecomeLeader()
    await this.subscribeToCoasterCreation()
  }

  async subscribeToCoasterCreation() {
    this.subscriber.subscribe('dataUpdated', async (data) => {
      await this.makeStatistics()
    })
  }

  async makeStatistics() {
    if(!this.leaderRedisService.isLeader && this.redisService.getIsRedisConnected()) {
      return
    }
    const statistics = await this.getCoastersStatisticsData()
    for(const statistic of statistics) {
      let logMessage = `[Kolejka: ${statistic.coaster.id}]`
      logMessage += `\n 1. Godziny działania: ${statistic.coaster.godziny_od} - ${statistic.coaster.godziny_do}`
      let i = 2
      for(const {message, problemsMessage} of statistic.statisticsData) {
        logMessage += `\n ${i}. ${message}`
        i++
      }
      const problems = statistic.statisticsData.filter(statistic => statistic.problemsMessage)
      if(problems.length) {
        logMessage += `\n Problem: ${problems.map(problem => problem.problemsMessage).join(', ')}`
      } else {
        logMessage += `\n Status: Ok`
      }
      this.loggerService.info(logMessage)
    }
  }

  async getCoastersStatisticsData() {
    const coasters = await this.coasterService.getCoasters()
    const statistics = []
    for(const coaster of coasters) {
      const wagons = await this.wagonService.getCoasterWagons(coaster.id)
      const peopleStatistics = this.getPeopleStatisticsData(coaster, wagons)
      const clientsStatistics = this.getClientStatisticsData(coaster, wagons)
      statistics.push({
        coaster,
        statisticsData: [...peopleStatistics, ...clientsStatistics]
      })
    }
    return statistics
  }

  getPeopleStatisticsData(coaster, wagons) {
    const allPeople = coaster.liczba_personelu
    const neededPeople = wagons.length * this.personPerWagon + this.personPerCoaster
    const message = `Dostępny personel: ${allPeople}/${neededPeople}`
    let problemsMessage
    if(allPeople < neededPeople) {
      problemsMessage = `Brakuje ${neededPeople - allPeople} osób na obecną ilość wagonów`
    } else if(allPeople > neededPeople) {
      problemsMessage = `Nadmiar ${allPeople - neededPeople} osób na obecną ilość wagonów`
    }
    return [{
      message,
      problemsMessage,
    }]
  }

  getClientStatisticsData(coaster, wagons) {
    const allClients = coaster.liczba_klientow
    let allPossibleClientsPerWagon = 0
    for(const wagon of wagons) {
      allPossibleClientsPerWagon += this.getWagonPossibleCoursesCount(coaster, wagon) * wagon.ilosc_miejsc
    }
    const clientMessage = `Klienci dziennie: ${allPossibleClientsPerWagon}/${allClients}`
    if(allClients > allPossibleClientsPerWagon) {
      const {neededWagons, neededPeople} = this.getMissingWagons(coaster, wagons)
      return [{
        message: clientMessage,
        problemsMessage: `Za mało mocy przerobowej`,
      }, {
        message: `Liczba wagonów: ${wagons.length}/${wagons.length + neededWagons}`,
        problemsMessage: `Brakuje ${neededWagons} wagonów i ${neededPeople} osób, aby obsłużyć wszystkich klientów`,
      }]
    } else if(allClients < allPossibleClientsPerWagon * 2) {
      const {excessWagons, excessPeople} = this.getExcessWagonsAndPeople(coaster, wagons)
      return [{
        message: clientMessage,
        problemsMessage: `Za dużo mocy przerobowej`,
      }, {
        message: `Liczba wagonów: ${wagons.length - excessWagons.length}/${wagons.length}`,
        problemsMessage: `Można wyłączyć ${excessWagons.length} wagonów i ${excessPeople} osób, aby obsłużyć wszystkich klientów`,
      }]
    }
    return [{
      message: clientMessage,
    }, {
      message: `Liczba wagonów: ${wagons.length}/${wagons.length}`,
    }]
  }

  getExcessWagonsAndPeople(coaster, wagons) {
    const allClients = coaster.liczba_klientow
    let allPossibleClientsPerWagon = 0
    let lastNeededWagonId
    for(const wagon of wagons) {
      allPossibleClientsPerWagon += this.getWagonPossibleCoursesCount(coaster, wagon) * wagon.ilosc_miejsc
      if(allPossibleClientsPerWagon > allClients) {
        lastNeededWagonId = wagon.id
        break
      }
    }
    const excessWagons = wagons.slice(wagons.findIndex(wagon => wagon.id === lastNeededWagonId))
    const excessPeople = excessWagons.length * this.personPerWagon
    return {
      excessWagons,
      excessPeople
    }
  }

  getMissingWagons(coaster, wagons) { // ze wzgledu na to ze wagony mogą miec rozna ilosc miejsc, licze srednią aby sprawdzic ile wagonow potrzeba
    const allClients = coaster.liczba_klientow
    let allPossibleClientsPerWagon = 0
    for(const wagon of wagons) {
      allPossibleClientsPerWagon += this.getWagonPossibleCoursesCount(coaster, wagon) * wagon.ilosc_miejsc
    }
    const averageClientsPerWagon = (allPossibleClientsPerWagon / wagons.length) || this.defaultAverageClientsPerWagon
    const neededWagons = Math.ceil((allClients - allPossibleClientsPerWagon) / averageClientsPerWagon)
    const neededPeople = neededWagons * this.personPerWagon
    return {
      neededWagons,
      neededPeople
    }
  }

  getWagonPossibleCoursesCount(coaster, wagon) {
    const startDate = coaster.godziny_od
    const endDate = coaster.godziny_do
    const courseDistance = coaster.dl_trasy
    const minutesTimeToCompleteCourse = (courseDistance / wagon.predkosc_wagonu * 60)
    let coursesCount = 0
    let currentMinutesTime = this.timeService.getMinutesFromHourMinutesText(startDate)
    do {
      coursesCount++
      currentMinutesTime += minutesTimeToCompleteCourse
      currentMinutesTime += this.breakTimeInMinutes
    } while (currentMinutesTime < this.timeService.getMinutesFromHourMinutesText(endDate) - minutesTimeToCompleteCourse)
    return coursesCount
  }
}

module.exports = CoasterSystemService;