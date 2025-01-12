const fs = require('fs')
const path = require('path')

const DATA_FILE = path.join(__dirname, '../../../../data.json')

class CoasterLocalRepositoryStrategy {
  constructor() {
    this.data = this.readLocalData()
  }

  readLocalData() {
    if (!fs.existsSync(DATA_FILE)) {
      return { coasters: [] }
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(fileContent)
  }

  writeLocalData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  }

  async createCoaster(data) {
    const { liczba_personelu, liczba_klientow, dl_trasy, godziny_od, godziny_do } = data
    const id = this.data.coasters.length + 1
    const newCoaster = {
      id: id.toString(),
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
      wagons: [],
    }
    this.data.coasters.push(newCoaster)
    this.writeLocalData(this.data)
    return newCoaster
  }

  async getCoasters() {
    return this.data.coasters
  }

  async updateCoaster(coasterId, data) {
    const { liczba_personelu, liczba_klientow, dl_trasy, godziny_od, godziny_do } = data
    const index = this.data.coasters.findIndex((coaster) => coaster.id === coasterId)
    if (index === -1) {
      throw new Error(`Nie znaleziono kolejki o id ${coasterId}`)
    }
    const updatedCoaster = {
      ...this.data.coasters[index],
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    }
    this.data.coasters[index] = updatedCoaster
    this.writeLocalData(this.data)
    return updatedCoaster
  }

  async getCoaster(coasterId) {
    const coaster = this.data.coasters.find((coaster) => coaster.id === coasterId)
    if (!coaster) {
      throw new Error(`Nie znaleziono kolejki o id ${coasterId}`)
    }
    return coaster
  }
}

module.exports = CoasterLocalRepositoryStrategy