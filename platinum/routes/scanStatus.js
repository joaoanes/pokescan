var spawn = require('child_process').spawn
var AccountManager = require('./accountManager.js')
var accountManagerSingleton = AccountManager.singleton()
var sscanf = require('scanf').sscanf

function generate_spiral(starting_lat, starting_lng, step_size, step_limit)
{
    var coords = [[starting_lat, starting_lng]]
    var steps = 1
    var x = 0
    var y = 0
    var d = 1
    var m = 1
    var rhigh = 0.0005

    while (steps < step_limit)
    {
        while ((2 * x * d < m) && (steps < step_limit))
        {
            x = x + d
            steps += 1
            lat = x * step_size + starting_lat + Math.random() * rhigh
            lng = y * step_size + starting_lng + Math.random() * rhigh
            coords.push([lat, lng])
        }
        while ((2 * y * d < m) && (steps < step_limit))
        {
            y = y + d
            steps += 1
            lat = x * step_size + starting_lat + Math.random() * rhigh
            lng = y * step_size + starting_lng + Math.random() * rhigh
            coords.push([lat, lng])
        }
        d = -1 * d
        m = m + 1
    }

    return coords
}

function ScanStatus(location, status, job, callback) {

	this.location = location
	this.status = status || "scanning"
	this.last_scan = null
	this.callback = callback
	this.job = job
	this.jobId = job.jobId
	this.remainingCoordinates = generate_spiral(location[0], location[1], 0.001, 80)
	this.doneCoordinates = []

	var coordinates = this.remainingCoordinates

	console.log("starting swarm id " + job.jobId + " for " + location)
	var self = this

	coordinates.forEach( (coords, i) => {

		startSwarmWorker(self, coords, i)

	})
	this.timeout = setTimeout(()=>{
		console.log(`\n\nswarm with job id ${this.jobId} timed out, \n\n${this.remainingCoordinates} left`)
		this.remainingCoordinates = []
		callback()
	}, 120000)
	this.payload = { jobId: job.jobId }

}

statuses = {
	SCANNED: "scanned",
	SCANNING: "scanning",
	STARTING: "starting",
	FINISHED: "finished"
}


function updateSwarm(self, coords)
	{
		var index = self.remainingCoordinates.indexOf(coords)
		self.doneCoordinates.push(coords)
		self.remainingCoordinates.splice(index, 1)

		if (self.remainingCoordinates.length == 0)
		{
			console.log(`\n\nswarm with job id ${self.jobId} has finished!\n ${self.remainingCoordinates.length} left\n\n`)
			clearTimeout(self.timeout)
			self.callback()
		}
	}

function spawnWorker(self, account, coords, swarmId, job)
{
		var instance = spawn('stdbuf', [
					'-i0', '-o0', '-e0',
					'docker', 'run', '-i', '--rm', '--link', process.env.DOCKER_MONGO_NAME, 'pgoapi-runner',
					'-u', account,
					'-p', "password",
					'-a', "ptc",
					'-l', coords[0],
					'-L', coords[1],
					'-d'
					],
					{ cwd: "../pgoapi/" })

		var instanceStatus = "starting"

		var timeout = setTimeout(()=>{
			if (self.remainingCoordinates.indexOf(coords) != -1)
			{
				console.log(`Imma say this one crashed ${coords}, restarting`)
				instanceStatus = "timeout"
				instance.stdin.pause()
				instance.stdout.pause()
				instance.kill('SIGKILL')
				AccountManager.releaseAccount(accountManagerSingleton, account, true)
				account = undefined
			}
		}, 30000)

		instance.stderr.on('data', (data) => {
			console.log(`\n${coords} crashed\n\n${data}\n\n`)
			instanceStatus = "error output"
			AccountManager.releaseAccount(accountManagerSingleton, account, true)
			account = undefined
			if (data.toString().search("Could not retrieve token"))
				instanceStatus = "error login"
		})

		instance.stdout.on('data', (data) => {
			console.log(`stdout for ${swarmId}: ${data}`);
			var progress = sscanf(data.toString(), '%f %f complete')
			if (isNaN(progress[0]))
			{
				instanceStatus = "wrong output"
				console.log(`error for swarm id ${swarmId}, not progressing\n\n`)
				AccountManager.releaseAccount(accountManagerSingleton, account, true)
				account = undefined
				return
			}

			job.progress(data)
			instanceStatus = "complete"

			AccountManager.releaseAccount(accountManagerSingleton, account)
			account = undefined
		})

		instance.on('exit', (code) => {
			console.log(`swarm member ${swarmId} is exiting, status: ${instanceStatus} ${self.remainingCoordinates.length} remaining`)
			clearTimeout(timeout)

			if (instanceStatus != "complete")
			{
				console.log("\nnot good enough, retrying..\n")
				startSwarmWorker(self, coords, swarmId)
			}
		})

		return instance
	}
	function startSwarmWorker(self, coords, swarmId)
	{

		AccountManager.getAccount(accountManagerSingleton).then((account) => {
				console.log(`swarm member ${swarmId} spawned with account ${account}`)
				var dockerInstance = spawnWorker(self, account, coords, swarmId, self.job)
		}).catch( (e) => {
			console.log("ERROR: " + e)
		})
		console.log(`getting account for swarmId ${swarmId}`)
	}


ScanStatus.statuses = statuses

ScanStatus.prototype.change_status = function(status) {
	this.status = statuses[status]
}

module.exports = {factory: ScanStatus, statuses: statuses, startSwarmWorker: startSwarmWorker, updateSwarm: updateSwarm}
