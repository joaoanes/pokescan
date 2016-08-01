var spawn = require('child_process').spawn

function ScanStatus(location, status, job, callback) {

	this.location = location
	this.status = status || "scanning"
	this.last_scan = null

	var dockerInstance = spawn('stdbuf', [
		'-i0', '-o0', '-e0',
		'docker', 'run', '-i', '--rm', '--link', process.env.DOCKER_MONGO_NAME, 'pgoapi-runner',
		'-u', process.env.LOGIN_USERNAME,
		'-p', process.env.LOGIN_PASSWORD,
		'-a', process.env.LOGIN_SERVICE,
		'-l', location[0],
		'-L', location[1],
		'-d'
		],
		{cwd: "../pgoapi/", env: process.env}
	)

	console.log("starting job " + job.jobId + " for " + location)

	dockerInstance.stdout.on('data', (data) => {

		console.log(`stdout: ${data}`);
		job.progress(data)
	})

	dockerInstance.stderr.on('data', (data) => {
		console.log("err :" + data)
	})

	dockerInstance.on('exit', (code) => {
		console.log(job.jobId + " is exiting")
		callback()
	})

	this.payload = { jobId: job.jobId }

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
