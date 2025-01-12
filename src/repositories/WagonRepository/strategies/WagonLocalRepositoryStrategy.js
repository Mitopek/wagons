const fs = require('fs')
const path = require('path')
const DATA_FILE = path.join(__dirname, '../../../../data.json')

class WagonLocalRepositoryStrategy {
  constructor() {
    this.data = this.readLocalData()
  }

  readLocalData() {
    if (!fs.existsSync(DATA_FILE)) {
      return { coasters: [], wagons: [] }
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(fileContent)
  }

  writeLocalData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  }

  async createWagon(coasterId, data) {
    const { ilosc_miejsc, predkosc_wagonu } = data

    const coasterExists = this.data.coasters.some((coaster) => coaster.id === coasterId)
    if (!coasterExists) {
      throw new Error(`Nie znaleziono kolejki o id ${coasterId}`)
    }
    const currentWagonsCount = this.data.wagons?.length || 0
    const id = (currentWagonsCount + 1).toString()
    const newWagon = {
      id,
      ilosc_miejsc,
      predkosc_wagonu,
      coasterId,
    }
    if(!this.data.wagons) this.data.wagons = []
    this.data.wagons.push(newWagon)
    this.writeLocalData(this.data)
    return newWagon
  }

  async deleteWagon(coasterId, wagonId) {
    const wagonIndex = this.data.wagons.findIndex(
      (wagon) => wagon.id === wagonId && wagon.coasterId === coasterId
    )
    if (wagonIndex === -1) {
      throw new Error(`Wagon o id ${wagonId} nie istnieje w kolejce o id ${coasterId}`)
    }

    this.data.wagons.splice(wagonIndex, 1)
    this.writeLocalData(this.data)
  }

  async getWagons() {
    return this.data.wagons
  }

  async getCoasterWagons(coasterId) {
    return this.data.wagons.filter((wagon) => wagon.coasterId === coasterId)
  }
}

module.exports = WagonLocalRepositoryStrategy