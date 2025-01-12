class TimeService {
  constructor() {
  }

  getMinutesFromHourMinutesText(hourMinutesText) {
    const [hour, minutes] = hourMinutesText.split(':').map(Number)
    return hour * 60 + minutes
  }
}

module.exports = TimeService;