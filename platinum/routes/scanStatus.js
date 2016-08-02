var spawn = require('child_process').spawn
var mergeStream= require('merge-stream')

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
	this.remainingCoordinates = generate_spiral(location[0], location[1], 0.001, 47)
	this.doneCoordinates = []

	var coordinates = this.remainingCoordinates
	//HUGE RACING CONDITION
	var superStream = mergeStream()
	var superErrStream = mergeStream()

	superStream.on('data', (data) => {
		console.log(`stdout: ${data}`);
		job.progress(data)
	})



	console.log("starting swarm id " + job.jobId + " for " + location)

	coordinates.forEach( (coords, i) => {
		var account = accounts[Math.floor(Math.random()*accounts.length)]
		console.log(`swarm member ${i} spawned with account ${account}`)
		var dockerInstance = spawn('stdbuf', [
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

		setTimeout(()=>{
			if (this.remainingCoordinates.indexOf(coords) != -1)
			{
				console.log(`Imma say this one crashed ${coords}`)
				this.updateSwarm(coords)
			}
		}, 30000)

		superStream.add(dockerInstance.stdout)
		dockerInstance.stderr.on('data', (data) => {
			console.log(`${coords} crashed, retrying`)
		})

		dockerInstance.on('exit', (code) => {
			console.log(`swarm member ${i} is exiting, ${this.remainingCoordinates.length} remaining`)

		})


	})

	this.payload = { jobId: job.jobId }

}

ScanStatus.prototype.updateSwarm = function(coords)
{
	var index = this.remainingCoordinates.indexOf(coords)
	this.doneCoordinates.push(coords)
	this.remainingCoordinates.splice(index, 1)

	if (this.remainingCoordinates.length == 0)
	{
		console.log(`swarm with job id ${this.jobId} has finished! ${this.remainingCoordinates.length} left`)
		this.callback()
	}
}

statuses = {
	SCANNED: "scanned",
	SCANNING: "scanning",
	STARTING: "starting",
	FINISHED: "finished"
}

ScanStatus.statuses = statuses

ScanStatus.prototype.change_status = function(status) {
	this.status = statuses[status]
}

module.exports = ScanStatus
