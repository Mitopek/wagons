class CoasterController {
  constructor(coasterService, coasterSystemService) {
    this.coasterService = coasterService;
    this.coasterSystemService = coasterSystemService;
  }

  async createCoaster(req, res) {
    const {
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    } = req.body
    if(!liczba_personelu || !liczba_klientow || !dl_trasy || !godziny_od || !godziny_do) {
      return res.status(400).json({ message: 'Brak wymaganych pól' })
    }
    const coaster = await this.coasterService.createCoaster({
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    })
    await this.coasterSystemService.makeStatistics()
    res.json(coaster)
  }

  async updateCoaster(req, res) {
    const { coasterId } = req.params
    const {
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    } = req.body
    const coaster = await this.coasterService.updateCoaster(coasterId, {
      liczba_personelu,
      liczba_klientow,
      dl_trasy,
      godziny_od,
      godziny_do,
    })
    await this.coasterSystemService.makeStatistics()
    res.json(coaster)
  }
}

module.exports = CoasterController;