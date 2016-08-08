var Queue = require('bull')
var ScanStatus = require('./scanStatus.js').factory
var _ = require('underscore')
var sscanf = require('scanf').sscanf
var spawn = require('child_process').spawn



function scanQueue(name, locationsHsh) {

	this.locationQueue = Queue(name, 6379, '127.0.0.1')
	this.locationsHash = locationsHsh

	this.locationQueue.process(parseInt(process.env.CONCURRENCY), (job, done) => {

		var location = job.data['location']

		this.locationsHash[location.location] = new ScanStatus(location.latLng, "SCANNING", job, done)
		this.locationsHash[location.location].status = "starting"
		this.locationsHash[location.location].payload = { jobId: job.jobId }

	});

	this.locationQueue.on('progress', (job, progress) => {
		status = _.filter(Object.keys(this.locationsHash), (scanStatusKey) => { return this.locationsHash[scanStatusKey].jobId == job.jobId })[0]
		status = this.locationsHash[status]
		if (!status)
		{
			console.log("got orphaned job, will ignore " + job.jobId)
			return
		}
		if (status.status == "scanning" || status.status == "starting")
			this.process_single_line(status, progress)
	})

	this.locationQueue.on('completed', (job) => {
		status = _.filter(Object.keys(this.locationsHash), (scanStatusKey) => { return this.locationsHash[scanStatusKey].jobId == job.jobId })[0]
		status = this.locationsHash[status]
		if (!status)
		{
			console.log("finished orphaned job, will ignore " + job.jobId)
			return
		}

		status.status = ScanStatus.statuses.SCANNED

		status.last_scan = Date.now()

	})

	this.locationQueue.on('error', function(error) {
		console.log("queue error: " + error)
	})

	this.locationQueue.on('failed', function(job, err){
		status = _.filter(this.locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]
		if (status)
			status.status = "failed"
		console.log("queue failed: " + job + " " + err)
	})

	this.start_scan = function(location, force)
	{
		force = force || false

		if (force)
		{
			console.log("FORCING CREATION OF " + JSON.stringify(location))
			this.locationQueue.add({ location: location })
		}
		else
		{
			if (this.locationsHash[location.location])
			{
				if (this.locationsHash[location.location].status == ScanStatus.statuses.SCANNING || this.locationsHash[location.location].status == ScanStatus.statuses.STARTING)
				{
					console.log("not running scan for " + location.location + ", not ready")
					return
				}
				else
					this.locationQueue.add({ location: location })

			}
			else
				this.locationQueue.add({ location: location })
		}
	}

	this.process_single_line = function(status, progress)
	{
		status.status = ScanStatus.statuses.SCANNING
		progress = sscanf(progress.toString(), '%f %f complete')
		require('./scanStatus.js').updateSwarm(status,[progress[0], progress[1]])

		status.payload.percentage = Number((status.doneCoordinates.length / (status.doneCoordinates.length + status.remainingCoordinates.length) * 100).toFixed(1))
		if (!status.payload.warps)
			status.payload.warps = []

		status.payload.warps.push([progress[0], progress[1]])
	}


	return this
}



module.exports = {factory: scanQueue}
