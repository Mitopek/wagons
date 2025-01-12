async function runTasksOnStart(coasterSystem) {
  await coasterSystem.syncData()
  await coasterSystem.start()
}

module.exports = runTasksOnStart;