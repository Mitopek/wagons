class WagonController {
  constructor(wagonService, coasterSystemService) {
    this.wagonService = wagonService;
    this.coasterSystemService = coasterSystemService
  }

  async createWagon(req, res) {
    const {
      ilosc_miejsc,
      predkosc_wagonu,
    } = req.body
    const { coasterId } = req.params
    if(!ilosc_miejsc || !predkosc_wagonu) {
      return res.status(400).json({ message: 'Brak wymaganych pól' })
    }
    const wagon = await this.wagonService.createWagon(coasterId, {
      ilosc_miejsc,
      predkosc_wagonu,
    })
    await this.coasterSystemService.makeStatistics()
    res.json(wagon)
  }

  async deleteWagon(req, res) {
    const { wagonId , coasterId} = req.params
    const wagon = await this.wagonService.deleteWagon(coasterId, wagonId)
    await this.coasterSystemService.makeStatistics()
    res.json(wagon)
  }
}

module.exports = WagonController;