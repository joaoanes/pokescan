var Queue = require('bull')
var locationQueue = Queue('location scanning', 6379, '127.0.0.1')
var ScanStatus = require('./scanStatus.js')
var _ = require('underscore')
var sscanf = require('scanf').sscanf
var spawn = require('child_process').spawn


var locationsHash = {}


//LOCATIONS QUEUE STUFF
locationQueue.process(4, (job, done) => {
	var location = job.data['location']

	locationsHash[location] = new ScanStatus(location, "SCANNING", job, done)

	locationsHash[location].status = "starting"
	locationsHash[location].payload = { jobId: job.jobId }


});

locationQueue.on('progress', (job, progress) => {
	status = _.filter(locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]
	if (!status)
	{
		console.log("\n\n\nATTN\n\n\n" + job.jobId + "\n\n\n")
		return
	}
	if (status.status == "scanning" || status.status == "starting")
		process_single_line(status, progress)
	else
		process_finishing(status, progress)
})

locationQueue.on('completed', (job) => {
	status = _.filter(locationsHash, (scanStatus) => { return scanStatus.payload.jobId == job.jobId })[0]

	status.status = ScanStatus.statuses.SCANNED

	status.last_scan = Date.now()

	if (jobsFinishCache[job.jobId])
		status.payload = jobsFinishCache[job.jobId].join("")
	else
		status.payload = "FUCK"
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

var start_scan = function(location)
{
	locationQueue.add({ location: location })
}

var jobsFinishCache = {}

function process_finishing(status, progress) {
	debugger
	if (!jobsFinishCache[status.payload.jobId])
		jobsFinishCache[status.payload.jobId] = []

	jobsFinishCache[status.payload.jobId].push(progress)
}

function process_single_line(status, progress)
{
	status.status = ScanStatus.statuses.SCANNING
	progress = sscanf(progress.toString(), '%f complete, at %f %f')

	status.payload.percentage = progress[0]
	if (status.payload.percentage == 100.0)
		status.status = "finishing"

	if (!status.payload.warps)
		status.payload.warps = []

	status.payload.warps.push([progress[1], progress[2]])
}


module.exports = {queue: locationQueue, hash: locationsHash, start_scan: start_scan}
