const LEADER_KEY = 'system:leader'
const LEADER_TTL = 10000
const CHECK_LEADER_INTERVAL = 15000

class LeaderRedisService {
  constructor(redisClient, loggerService) {
    this.redisClient = redisClient
    this.loggerService = loggerService
    this.isLeader = false
    this.heartbeatInterval = null
    this.checkLeaderInterval = null
  }

  async tryToBecomeLeader() {
    try {
      const result = await this.redisClient.set(LEADER_KEY, 'leader', {
        NX: true, // Ustaw klucz tylko, jeśli nie istnieje
        PX: LEADER_TTL // Czas wygaśnięcia klucza (TTL)
      })

      if (result) {
        this.isLeader = true
        this.loggerService.info('Zostałem liderem')
        this.startHeartbeat()
        this.stopCheckingLeadership()
      } else {
        this.isLeader = false
        this.loggerService.info('Inny węzeł jest liderem')
        this.startCheckingLeadership()
      }
    } catch (error) {
      this.loggerService.error('Nie udało się spróbować wyboru lidera', error)
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)

    this.heartbeatInterval = setInterval(async () => {
      if (this.isLeader) {
        try {
          await this.redisClient.set(LEADER_KEY, 'leader', { PX: LEADER_TTL })
        } catch (error) {
          this.loggerService.error('Nie udało się odnowić liderowania', error)
          this.isLeader = false
          this.stopHeartbeat()
        }
      }
    }, LEADER_TTL / 2)
  }

  startCheckingLeadership() {
    if (this.checkLeaderInterval) return

    this.checkLeaderInterval = setInterval(async () => {
      if (!this.isLeader) {
        this.loggerService.info('Próbuję zostać liderem')
        await this.tryToBecomeLeader()
      }
    }, CHECK_LEADER_INTERVAL)
  }

  stopCheckingLeadership() {
    if (this.checkLeaderInterval) {
      clearInterval(this.checkLeaderInterval)
      this.checkLeaderInterval = null
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  async releaseLeadership() {
    try {
      if (this.isLeader) {
        await this.redisClient.del(LEADER_KEY)
        this.isLeader = false
        this.stopHeartbeat()
        this.loggerService.info('Zwolniłem liderowanie')
      }
    } catch (error) {
      this.loggerService.error('Nie udało się zwolnić liderowania', error)
    }
  }

  async isCurrentLeader() {
    return this.isLeader
  }
}

module.exports = LeaderRedisService