var Queue = require('bull')
var locationQueue = Queue('location scanning', 6379, '127.0.0.1')
var ScanStatus = require('./scanStatus.js').factory
var _ = require('underscore')
var sscanf = require('scanf').sscanf
var spawn = require('child_process').spawn


var locationsHash = {}


//LOCATIONS QUEUE STUFF

locationQueue.process(parseInt(process.env.CONCURRENCY), (job, done) => {

	var location = job.data['location']

	locationsHash[location.location] = new ScanStatus(location.latLng, "SCANNING", job, done)
	locationsHash[location.location].status = "starting"
	locationsHash[location.location].payload = { jobId: job.jobId }


});

locationQueue.on('progress', (job, progress) => {
	status = _.filter(locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]
	if (!status)
	{
		console.log("got orphaned job, will ignore " + job.jobId)
		return
	}
	if (status.status == "scanning" || status.status == "starting")
		process_single_line(status, progress)
})

locationQueue.on('completed', (job) => {
	status = _.filter(locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]

	if (!status)
	{
		console.log("finished orphaned job, will ignore " + job.jobId)
		return
	}

	status.status = ScanStatus.statuses.SCANNED

	status.last_scan = Date.now()

	if (jobsFinishCache[job.jobId])
		status.payload = scanStatus.doneCoordinates
})

locationQueue.on('error', function(error) {
	console.log("queue error: " + error)
})

locationQueue.on('failed', function(job, err){
	status = _.filter(locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]
	if (status)
		status.status = "failed"
	console.log("queue failed: " + job + " " + err)
})

var start_scan = function(location, force)
{
	force = force || false

	if (force)
	{
		console.log("FORCING CREATION OF " + JSON.stringify(location))
		locationQueue.add({ location: location })
	}
	else
	{
		if (locationsHash[location.location])
		{
			if (locationsHash[location.location].status == ScanStatus.statuses.SCANNING || locationsHash[location.location].status == ScanStatus.statuses.STARTING)
			{
				console.log("not running scan for " + location.location + ", not ready")
				return
			}
			else
				locationQueue.add({ location: location })

		}
		else
			locationQueue.add({ location: location })
	}
}

var jobsFinishCache = {}

function process_single_line(status, progress)
{
	status.status = ScanStatus.statuses.SCANNING
	progress = sscanf(progress.toString(), '%f %f complete')
	require('./scanStatus.js').updateSwarm(status,[progress[0], progress[1]])

	status.payload.percentage = Number((status.doneCoordinates.length / (status.doneCoordinates.length + status.remainingCoordinates.length) * 100).toFixed(1))
	if (!status.payload.warps)
		status.payload.warps = []

	status.payload.warps.push([progress[0], progress[1]])
}


module.exports = {queue: locationQueue, hash: locationsHash, start_scan: start_scan}
