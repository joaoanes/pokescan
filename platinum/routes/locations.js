var express = require('express')
var router = express.Router()
var Queue = require('bull')
var locationQueue = Queue('location scanning', 6379, '127.0.0.1')

var Docker = require('dockerode');

var _ = require('underscore')
var sscanf = require('scanf').sscanf

var locationsHash = {}


var spawn = require('child_process').spawn


//LOCATIONS QUEUE STUFF
locationQueue.process((job, done) => {


  var location = job.data['location']

  //update the location hash
  locationsHash[location]["status"] = "scanning - starting"
  locationsHash[location]["payload"] = { jobId: job.jobId }


  dockerInstance = spawn('docker', ['run', '-i', '-a', 'stdout', '--rm', '--link', 'some-mongo:mongo', 'pgoapi-runner', '-u', process.env.LOGIN_USERNAME, '-p', process.env.LOGIN_PASSWORD, '-a', process.env.LOGIN_SERVICE, '-l', location], {cwd: "../pgoapi/"})

  dockerInstance.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    job.progress(data)
  })

  dockerInstance.stderr.on('data', (data) => {
    console.log("err :" + data)
  })

  dockerInstance.on('exit', (code) => {
    console.log(code + " is exiting")
    done()
  })

});

locationQueue.on('error', function(error) {
  debugger
})

locationQueue.on('progress', (job, progress) => {
  console.log("progress! :" + progress)
  location = _.filter(locationsHash, (hashJob) => { return hashJob.jobId == job.jobId })[0]

  location["status"] = "scanning"
  debugger
  progress = sscanf(progress.toString(), '%f complete, at %f %f')

  if (!location["payload"])
    location["payload"] = {}
  location["payload"]["percentage"] = progress[0]

  if (!location["payload"]["warps"])
    location["payload"]["warps"] = []

  location["payload"]["warps"].push([progress[1], progress[2]])
})

locationQueue.on('completed', (job) => {

  location = _.filter(locationsHash, (hashJob) => { return hashJob.jobId == job.jobId })[0]
  location["status"] = "scanned"
  location["last_scan"] = Date.now()
  location["payload"] = null

})

locationQueue.on('failed', function(job, err){
  debugger
})


router.get('/:location/scan', (req, res, next) => {
  locationQueue.add({ location: req.params.location }).then( (job) => {
      locationsHash[req.params.location] =
        {
          status: "created",
          last_scan: null,
          jobId: job.jobId,
          payload: null //can change depending on status
        }
  })
})

/* GET users listing. */
router.get('/:location', (req, res, next) => {
  if (locationsHash[req.params.location])
  {
    //location is either scanning or completed or something
  }
  else
  {
    locationQueue.add({ location: req.params.location }).then( (job) => {
      locationsHash[req.params.location] =
        {
          status: "created",
          last_scan: null,
          jobId: job.jobId,
          payload: null //can change depending on status
        }
    })
  }

    res.send(locationsHash[req.params.location]);
});

module.exports = router;
